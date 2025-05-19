// controllers/recommendationController.js - Job recommendation controller using Hugging Face
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
      id: job._id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      skills: job.skills,
      jobType: job.jobType,
      salary: job.salary
    }));
    
    // Create AI prompt
    const prompt = `
    You are an AI job matcher. Your task is to find the top 3 job matches for a candidate based on their profile and available job listings.
    
    Candidate Profile:
    - Name: ${profile.name}
    - Location: ${profile.location}
    - Years of Experience: ${profile.yearsOfExperience}
    - Skills: ${profile.skills.join(', ')}
    - Preferred Job Type: ${profile.preferredJobType}
    
    Available Jobs:
    ${JSON.stringify(jobsData, null, 2)}
    
    Please analyze the candidate's profile and the available jobs, then return the top 3 job matches with the following format:
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
    `;
    
    // Call Hugging Face Inference API
    // Using a free text generation model (e.g., google/flan-t5-base)
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/google/flan-t5-large',
      {
        inputs: prompt,
        parameters: {
          max_length: 1024,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Parse AI response
    const recommendationsText = response.data[0].generated_text;
    
    // Extract JSON from the response
    try {
      // First attempt to find a valid JSON array in the response
      const recommendationsMatch = recommendationsText.match(/\[[\s\S]*\]/);
      let recommendations;
      
      if (recommendationsMatch) {
        // Try to parse the matched JSON array
        recommendations = JSON.parse(recommendationsMatch[0]);
      } else {
        // If no JSON array is found, use a fallback matching method
        // Sometimes the model returns non-perfectly formatted JSON
        // Extract job IDs from the response
        const jobIdsMatch = recommendationsText.match(/"id"\s*:\s*"([^"]+)"/g);
        const matchedIds = jobIdsMatch 
          ? jobIdsMatch.map(match => match.match(/"id"\s*:\s*"([^"]+)"/)[1])
          : [];
          
        // Use the extracted IDs to create recommendations
        recommendations = matchedIds.slice(0, 3).map((id, index) => {
          const job = jobsData.find(j => j.id === id) || jobsData[index];
          return {
            id: job.id,
            title: job.title,
            company: job.company,
            matchScore: 95 - (index * 5), // Simple scoring based on order
            matchReasons: [
              `Skill match with candidate's profile`,
              `Job type (${job.jobType}) aligns with preference`,
              `Relevant to candidate's experience level`
            ]
          };
        });
        
        // If no IDs were matched, fall back to basic filtering
        if (recommendations.length === 0) {
          // Fallback: find jobs with matching skills
          const skillMatchJobs = jobsData
            .map(job => {
              const matchingSkills = job.skills.filter(skill => 
                profile.skills.includes(skill)
              );
              return {
                ...job,
                matchingSkillsCount: matchingSkills.length,
                matchingSkills
              };
            })
            .sort((a, b) => b.matchingSkillsCount - a.matchingSkillsCount)
            .slice(0, 3);
            
          recommendations = skillMatchJobs.map((job, index) => ({
            id: job.id,
            title: job.title,
            company: job.company,
            matchScore: 85 - (index * 5),
            matchReasons: [
              `Matches ${job.matchingSkillsCount} of your skills: ${job.matchingSkills.join(', ')}`,
              `Job type (${job.jobType}) is compatible with your preferences`,
              `Located in ${job.location}`
            ]
          }));
        }
      }
      
      // Get full job details for each recommendation
      const recommendationsWithDetails = await Promise.all(
        recommendations.map(async (rec) => {
          const job = await Job.findById(rec.id);
          return {
            ...rec,
            jobDetails: job
          };
        })
      );
      
      res.json(recommendationsWithDetails);
    } catch (parseError) {
      console.error('Failed to parse recommendations:', parseError);
      
      // Fallback: simple skill-based matching if AI parsing fails
      const skillMatchJobs = jobsData
        .map(job => {
          const matchingSkills = job.skills.filter(skill => 
            profile.skills.includes(skill)
          );
          return {
            ...job,
            matchingSkillsCount: matchingSkills.length,
            matchingSkills
          };
        })
        .sort((a, b) => b.matchingSkillsCount - a.matchingSkillsCount)
        .slice(0, 3);
        
      const recommendations = skillMatchJobs.map((job, index) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        matchScore: 85 - (index * 5),
        matchReasons: [
          `Matches ${job.matchingSkillsCount} of your skills: ${job.matchingSkills.join(', ')}`,
          `Job type (${job.jobType}) is compatible with your preferences`,
          `Located in ${job.location}`
        ],
        jobDetails: jobs.find(j => j._id.toString() === job.id)
      }));
      
      res.json(recommendations);
    }
  } catch (err) {
    console.error('Recommendation error:', err);
    
    // If the AI service fails, use fallback algorithm
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      const jobs = await Job.find();
      
      // Simple matching algorithm based on skills and job type
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
              `Based in ${job.location}`
            ],
            jobDetails: job
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 3);
        
      res.json(matchedJobs);
    } catch (fallbackErr) {
      console.error('Fallback matching error:', fallbackErr);
      res.status(500).json({ msg: 'Server error', error: err.message });
    }
  }
};