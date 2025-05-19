// controllers/recommendationController.js - Job recommendation controller
const { OpenAI } = require("openai");
const Profile = require("../models/Profile");
const Job = require("../models/Job");

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get job recommendations
exports.getJobRecommendations = async (req, res) => {
  try {
    // Get user profile
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ msg: "Profile not found" });
    }

    // Get all jobs
    const jobs = await Job.find();

    if (jobs.length === 0) {
      return res.status(404).json({ msg: "No jobs available" });
    }

    // Format jobs data for AI input
    const jobsData = jobs.map((job) => ({
      id: job._id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      skills: job.skills,
      jobType: job.jobType,
      salary: job.salary,
    }));

    // Create AI prompt
    const prompt = `
    You are an AI job matcher. Your task is to find the top 3 job matches for a candidate based on their profile and available job listings.
    
    Candidate Profile:
    - Name: ${profile.name}
    - Location: ${profile.location}
    - Years of Experience: ${profile.yearsOfExperience}
    - Skills: ${profile.skills.join(", ")}
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

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a job matching assistant that helps candidates find the best job matches based on their profile and available job listings.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 1024,
    });

    // Parse AI response
    const recommendationsText = response.choices[0].message.content;

    // Extract JSON from the response
    const recommendationsMatch = recommendationsText.match(/\[[\s\S]*\]/);
    if (!recommendationsMatch) {
      return res
        .status(500)
        .json({ msg: "Failed to parse AI recommendations" });
    }

    try {
      const recommendations = JSON.parse(recommendationsMatch[0]);

      // Get full job details for each recommendation
      const recommendationsWithDetails = await Promise.all(
        recommendations.map(async (rec) => {
          const job = await Job.findById(rec.id);
          return {
            ...rec,
            jobDetails: job,
          };
        })
      );

      res.json(recommendationsWithDetails);
    } catch (parseError) {
      console.error("Failed to parse recommendations JSON:", parseError);
      res
        .status(500)
        .json({
          msg: "Failed to parse AI recommendations",
          error: parseError.message,
        });
    }
  } catch (err) {
    console.error("Recommendation error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
