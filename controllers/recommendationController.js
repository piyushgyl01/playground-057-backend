// controllers/recommendationController-cohere.js - Alternative implementation using Cohere
const axios = require('axios');
const Profile = require('../models/Profile');
const Job = require('../models/Job');

// Get job recommendations
exports.getJobRecommendations = async (req, res) => {
  try {
    // Get user profile
    const profile = await Profile.findOne({ user: req.user.id });
    
    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }
    
    // Get all jobs
    const jobs = await Job.find();
    
    if (jobs.length === 0) {
      return res.status(404).json({ msg: 'No jobs available' });
    }
    
    // Format jobs data for AI input
    const jobsData = jobs.map(job => ({
      id: job._id.toString(),
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description.substring(0, 100),  // Truncate description
      skills: job.skills,
      jobType: job.jobType
    }));

    try {
      // Check if Cohere API key exists
      if (!process.env.COHERE_API_KEY) {
        throw new Error("COHERE_API_KEY not found in environment variables");
      }

      // Create prompt for Cohere API
      const prompt = `You are an AI job matcher. Find the top 3 job matches for this candidate based on their profile and the available job listings.
                
      Candidate Profile:
      - Name: ${profile.name}
      - Location: ${profile.location}
      - Years of Experience: ${profile.yearsOfExperience}
      - Skills: ${profile.skills.join(', ')}
      - Preferred Job Type: ${profile.preferredJobType}
      
      Available Jobs:
      ${JSON.stringify(jobsData)}
      
      Return ONLY a JSON array of the top 3 job matches with this format:
      [
        {
          "id": "job_id",
          "title": "job_title",
          "company": "company_name",
          "matchScore": 85,
          "matchReasons": ["reason1", "reason2", "reason3"]
        },
        ...
      ]
      
      The matchScore should be between 0-100 and represent how well the candidate matches the job requirements.
      The matchReasons should include 2-3 specific reasons why this job is a good match for the candidate.
      Return ONLY the JSON array with no additional text.`;
      
      // Call Cohere API
      const response = await axios.post(
        'https://api.cohere.ai/v1/generate',
        {
          model: 'command',
          prompt: prompt,
          max_tokens: 1024,
          temperature: 0.3,
          stop_sequences: [],
          return_likelihoods: 'NONE'
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("Cohere API responded successfully!");
      
      // Extract text from response
      const generatedText = response.data.generations[0].text;
      
      // Try to parse JSON from response
      try {
        // Find the JSON array in the text (it might have text before or after)
        const jsonMatch = generatedText.match(/\[\s*{[\s\S]*}\s*\]/);
        const jsonStr = jsonMatch ? jsonMatch[0] : generatedText.trim();
        
        const recommendations = JSON.parse(jsonStr);
        
        // Get full job details for each recommendation
        const recommendationsWithDetails = await Promise.all(
          recommendations.map(async (rec) => {
            const job = await Job.findById(rec.id);
            if (!job) {
              throw new Error(`Job with ID ${rec.id} not found`);
            }
            return {
              ...rec,
              jobDetails: job
            };
          })
        );
        
        return res.json(recommendationsWithDetails);
      } catch (parseError) {
        console.error("Failed to parse recommendations JSON:", parseError);
        console.log("Raw text:", generatedText);
        throw new Error("Failed to parse AI response, using fallback algorithm");
      }
    } catch (aiError) {
      console.log("Using skill-based matching fallback due to AI error:", aiError.message);
      
      // Fallback algorithm based on skill matching
      const matchedJobs = jobs
        .map(job => {
          // Calculate skill match percentage
          const matchingSkills = job.skills.filter(skill => 
            profile.skills.includes(skill)
          );
          const skillMatchScore = profile.skills.length > 0 
            ? (matchingSkills.length / profile.skills.length) * 100 
            : 0;
            
          // Job type match
          const jobTypeMatch = 
            profile.preferredJobType === 'any' || 
            profile.preferredJobType === job.jobType;
            
          // Calculate overall match score
          const matchScore = Math.round(
            (skillMatchScore * 0.7) + (jobTypeMatch ? 30 : 0)
          );
          
          return {
            id: job._id,
            title: job.title,
            company: job.company,
            matchScore: Math.min(matchScore, 99), // Cap at 99%
            matchReasons: [
              matchingSkills.length > 0 
                ? `Matches ${matchingSkills.length} of your skills: ${matchingSkills.join(', ')}`
                : 'The role may help you develop new skills',
              jobTypeMatch 
                ? `Job type (${job.jobType}) matches your preference`
                : 'This opportunity offers a different work arrangement',
              `Located in ${job.location}`
            ],
            jobDetails: job
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 3);
      
      // Add note about fallback for validation purposes
      matchedJobs.forEach(job => {
        job.usingFallback = true;
      });
      
      return res.json(matchedJobs);
    }
  } catch (err) {
    console.error('Recommendation error:', err);
    
    // Final fallback if everything else fails
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      const jobs = await Job.find();
      
      // Simple matching algorithm based on skills
      const recommendations = jobs
        .map(job => {
          const matchingSkillCount = job.skills.filter(skill => 
            profile.skills.includes(skill)
          ).length;
          
          return {
            job,
            matchingSkillCount,
            matchScore: Math.min(Math.round((matchingSkillCount / profile.skills.length) * 100), 99)
          };
        })
        .sort((a, b) => b.matchingSkillCount - a.matchingSkillCount)
        .slice(0, 3)
        .map(match => ({
          id: match.job._id,
          title: match.job.title,
          company: match.job.company,
          matchScore: match.matchScore,
          matchReasons: [
            `Skill compatibility: ${match.matchingSkillCount} matching skills`,
            `Job type: ${match.job.jobType} (${profile.preferredJobType === match.job.jobType ? 'matches' : 'differs from'} your preference)`,
            `Location: ${match.job.location}`
          ],
          jobDetails: match.job,
          usingFallback: true
        }));
      
      res.json(recommendations);
    } catch (fallbackErr) {
      console.error('Fallback matching error:', fallbackErr);
      res.status(500).json({ msg: 'Server error', error: err.message });
    }
  }
};