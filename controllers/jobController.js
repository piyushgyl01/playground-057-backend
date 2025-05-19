// controllers/jobController.js - Job controller
const Job = require('../models/Job');

// Get all jobs
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get job by ID
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }
    
    res.json(job);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Job not found' });
    }
    
    res.status(500).send('Server error');
  }
};

// Create a job
exports.createJob = async (req, res) => {
  const { title, company, location, description, skills, jobType, salary } = req.body;
  
  try {
    const newJob = new Job({
      title,
      company,
      location,
      description,
      skills: Array.isArray(skills) ? skills : skills.split(',').map(skill => skill.trim()),
      jobType,
      salary
    });
    
    const job = await newJob.save();
    res.json(job);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Update a job
exports.updateJob = async (req, res) => {
  const { title, company, location, description, skills, jobType, salary } = req.body;
  
  // Build job object
  const jobFields = {};
  if (title) jobFields.title = title;
  if (company) jobFields.company = company;
  if (location) jobFields.location = location;
  if (description) jobFields.description = description;
  if (skills) {
    jobFields.skills = Array.isArray(skills) ? skills : skills.split(',').map(skill => skill.trim());
  }
  if (jobType) jobFields.jobType = jobType;
  if (salary) jobFields.salary = salary;
  
  try {
    let job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }
    
    // Update job
    job = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: jobFields },
      { new: true }
    );
    
    res.json(job);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Job not found' });
    }
    
    res.status(500).send('Server error');
  }
};

// Delete a job
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }
    
    await job.remove();
    res.json({ msg: 'Job removed' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Job not found' });
    }
    
    res.status(500).send('Server error');
  }
};

// Seed jobs
exports.seedJobs = async (req, res) => {
  try {
    await Job.deleteMany({});
    
    const jobs = [
      {
        title: 'Frontend Developer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        description: 'We are looking for a talented Frontend Developer to join our team. The ideal candidate will have experience with React, HTML, CSS, and JavaScript.',
        skills: ['React', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS'],
        jobType: 'remote',
        salary: '$100,000 - $120,000'
      },
      {
        title: 'Backend Developer',
        company: 'DataSystems',
        location: 'New York, NY',
        description: 'Join our team as a Backend Developer. You will be responsible for developing and maintaining our server-side applications.',
        skills: ['Node.js', 'Express', 'MongoDB', 'API Development', 'JavaScript'],
        jobType: 'onsite',
        salary: '$110,000 - $130,000'
      },
      {
        title: 'Full Stack Developer',
        company: 'WebSolutions',
        location: 'Austin, TX',
        description: 'We are seeking a Full Stack Developer proficient in both frontend and backend technologies to help us build scalable web applications.',
        skills: ['React', 'Node.js', 'MongoDB', 'Express', 'JavaScript', 'HTML', 'CSS'],
        jobType: 'hybrid',
        salary: '$120,000 - $140,000'
      },
      {
        title: 'UI/UX Designer',
        company: 'CreativeMinds',
        location: 'Seattle, WA',
        description: 'Looking for a creative UI/UX Designer to create stunning user interfaces and improve user experience for our web and mobile applications.',
        skills: ['Figma', 'Adobe XD', 'UI Design', 'UX Research', 'Prototyping'],
        jobType: 'remote',
        salary: '$90,000 - $110,000'
      },
      {
        title: 'DevOps Engineer',
        company: 'CloudTech',
        location: 'Chicago, IL',
        description: 'Join us as a DevOps Engineer to help build and maintain our cloud infrastructure and CI/CD pipelines.',
        skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Terraform'],
        jobType: 'onsite',
        salary: '$130,000 - $150,000'
      },
      {
        title: 'Data Scientist',
        company: 'AnalyticsPro',
        location: 'Boston, MA',
        description: 'We are looking for a Data Scientist to analyze large datasets and build machine learning models to drive business decisions.',
        skills: ['Python', 'Machine Learning', 'SQL', 'Data Analysis', 'Statistics'],
        jobType: 'hybrid',
        salary: '$125,000 - $145,000'
      },
      {
        title: 'Mobile Developer',
        company: 'AppWorks',
        location: 'Los Angeles, CA',
        description: 'Join our team as a Mobile Developer to build native iOS and Android applications for our customers.',
        skills: ['React Native', 'iOS', 'Android', 'JavaScript', 'Swift', 'Kotlin'],
        jobType: 'remote',
        salary: '$110,000 - $130,000'
      },
      {
        title: 'Product Manager',
        company: 'ProductVision',
        location: 'Denver, CO',
        description: 'We are seeking a Product Manager to lead the development and launch of new products and features.',
        skills: ['Product Strategy', 'Agile', 'User Stories', 'Roadmapping', 'Market Research'],
        jobType: 'onsite',
        salary: '$120,000 - $140,000'
      },
      {
        title: 'QA Engineer',
        company: 'QualityTech',
        location: 'Remote',
        description: 'Looking for a QA Engineer to ensure the quality of our software products through thorough testing and automation.',
        skills: ['Test Automation', 'Selenium', 'Jest', 'API Testing', 'Bug Tracking'],
        jobType: 'remote',
        salary: '$90,000 - $110,000'
      },
      {
        title: 'Cybersecurity Analyst',
        company: 'SecureNet',
        location: 'Washington, DC',
        description: 'Join our team as a Cybersecurity Analyst to help protect our systems and data from security threats.',
        skills: ['Network Security', 'Vulnerability Assessment', 'Security Auditing', 'Incident Response', 'SIEM'],
        jobType: 'hybrid',
        salary: '$115,000 - $135,000'
      }
    ];
    
    await Job.insertMany(jobs);
    
    res.json({ msg: 'Jobs seeded successfully', count: jobs.length });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};