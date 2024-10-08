const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const cors = require("cors");
const bcrypt = require("bcrypt");
const session = require('express-session');

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid'); // Import uuid



const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(session({
  secret: 'Taknev321$', // Replace with your secret key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// MySQL Connection
const db = mysql.createConnection({
  host: 's2smsdatabase.cvme0g0k6zs6.ap-southeast-2.rds.amazonaws.com',
  user: 'admin',
  password: 'Taknev321$',
  database: 's2sms'
});

const saltRounds = 10; // Salt rounds for bcrypt hashing

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to MySQL database');
});

// AWS S3 configuration
AWS.config.update({
  accessKeyId: 'AKIA6GBMGVHDE2Z4I57D',
  secretAccessKey: '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',
  region: 'ap-south-2',
});

const s3 = new AWS.S3();



// Multer storage configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware to parse JSON and URL-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Function to upload files to AWS S3 with UUID
const uploadToS3 = (buffer, fileName, folder) => {
  const uniqueFileName = `${uuidv4()}-${fileName}`; // Add UUID to file name
  const params = {
    Bucket: 'svav-wesite-gallery',
    Key: `${folder}/${uniqueFileName}`,
    Body: buffer,
    ContentType: 'image/jpg', // Adjust based on file type if needed
  };

  return s3.upload(params).promise().then((data) => data.Location); // Return only the Location
};

// API to handle student registration
app.post('/adminStudentRegister', upload.single('photo'), async (req, res) => {
  const { fullname, className, section, rollNo, dateofbirth, fatherName, fatherNo, motherName, motherNo, admissionid, presentAddress } = req.body;

  // Check for missing fields
  const missingFields = [];
  if (!fullname) missingFields.push('fullname');
  if (!className) missingFields.push('className');
  if (!section) missingFields.push('section');
  if (!rollNo) missingFields.push('rollNo');
  if (!dateofbirth) missingFields.push('dateofbirth');
  if (!fatherName) missingFields.push('fatherName');
  if (!fatherNo) missingFields.push('fatherNo');
  if (!motherName) missingFields.push('motherName');
  if (!motherNo) missingFields.push('motherNo');
  if (!admissionid) missingFields.push('admissionid');
  if (!presentAddress) missingFields.push('presentAddress');
  if (!req.file) missingFields.push('photo');

  if (missingFields.length > 0) {
    return res.status(400).json({ error: `Missing fields: ${missingFields.join(', ')}` });
  }

  try {
    // Upload photo to S3 under smsstudentImages folder
    const s3FileUrl = await uploadToS3(req.file.buffer, req.file.originalname, 'smsstudentImages');
    
    // Log only the Location (S3 file URL)
    console.log('Uploaded Image URL:', s3FileUrl);

    // Insert student details into MySQL database
    const query = `
      INSERT INTO StudentDetails (fullname, className, section, rollNo, dateofbirth, fatherName, fatherNo, motherName, motherNo, admissionid, presentAddress, photo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [fullname, className, section, rollNo, dateofbirth, fatherName, fatherNo, motherName, motherNo, admissionid, presentAddress, s3FileUrl];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Database insert error:', err);
        return res.status(500).send('Error registering student');
      }
      res.status(200).send('Student registered successfully');
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Internal Server Error');
  }
});

// API to handle teacher registration
app.post('/AdminTeacherRegister', upload.single('photo'), async (req, res) => {
  const { fullname, subject, qualification, experience, dateofbirth, mobileNo, employeeid, presentAddress } = req.body;
  const file = req.file;

  // Check for missing fields
  const missingFields = [];
  if (!fullname) missingFields.push('fullname');
  if (!subject) missingFields.push('subject');
  if (!qualification) missingFields.push('qualification');
  if (!experience) missingFields.push('experience');
  if (!dateofbirth) missingFields.push('dateofbirth');
  if (!mobileNo) missingFields.push('mobileNo');
  if (!employeeid) missingFields.push('employeeid');
  if (!presentAddress) missingFields.push('presentAddress');
  if (!file) missingFields.push('photo');

  if (missingFields.length > 0) {
    return res.status(400).json({ error: `Missing fields: ${missingFields.join(', ')}` });
  }

  try {
    // Upload photo to S3 under smsTeacherImages folder
    const s3FileUrl = await uploadToS3(file.buffer, file.originalname, 'smsTeacherImages');

    // Log only the Location (S3 file URL)
    console.log('Uploaded Image URL:', s3FileUrl);

    // Insert teacher details into MySQL database
    const query = `
      INSERT INTO TeacherDetails (fullname, subject, qualification, experience, dateofbirth, mobileNo, employeeid, presentAddress, photo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [fullname, subject, qualification, experience, dateofbirth, mobileNo, employeeid, presentAddress, s3FileUrl];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Database insert error:', err);
        return res.status(500).send('Error registering teacher');
      }
      res.status(200).send('Teacher registered successfully');
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Internal Server Error');
  }
});

// API to handle fetching teacher details
app.get('/getTeacherDetails', async (req, res) => {
  try {
    // Fetch teacher details from the MySQL database
    const query = 'SELECT * FROM TeacherDetails';
    
    db.query(query, (err, results) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).send('Error fetching teacher details');
      }

      // Send the fetched data as JSON response
      res.status(200).json(results);
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Internal Server Error');
  }
});

// API to handle fetching teacher details by email
app.get('/teacherProfile', (req, res) => {
  const email = req.query.email;

  // Check if email is provided
  if (!email) {
    return res.status(400).send('Email parameter is required');
  }

  // Fetch teacher details from the MySQL database by email
  const query = 'SELECT * FROM TeacherDetails WHERE email = ?';
  
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).send('Error fetching teacher details');
    }

    if (results.length === 0) {
      return res.status(404).send('No teacher found with the provided email');
    }

    // Send the fetched data as JSON response
    res.status(200).json(results[0]);
  });
});

// GET API to fetch student profile by email
app.get('/StudentProfile', (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).send('Email is required');
  }

  const query = 'SELECT * FROM StudentDetails WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).send('Error retrieving student profile');
    }

    if (results.length === 0) {
      return res.status(404).send('No student found with the provided email');
    }

    res.status(200).json(results[0]);
  });
});

// API route to handle event submission
app.post('/events', upload.any(), async (req, res) => {
  const { description } = req.body;
  const mediaFiles = req.files;

  if (!description || !mediaFiles || mediaFiles.length === 0) {
    return res.status(400).send('Event description and media files are required');
  }

  const mediaUrls = [];

  try {
    // Upload each file to AWS S3
    for (let i = 0; i < mediaFiles.length; i++) {
      const file = mediaFiles[i];
      const uploadParams = {
        Bucket: 'svav-wesite-gallery', // Your S3 bucket name
        Key: `smseventimages/${uuidv4()}_${file.originalname}`, // Unique file name
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const data = await s3.upload(uploadParams).promise();
      mediaUrls.push(data.Location); // Store the URL of the uploaded file
    }

    // Insert event details into MySQL database
    const query = 'INSERT INTO SmsEvents (description, mediaUrls) VALUES (?, ?)';
    const values = [description, JSON.stringify(mediaUrls)];

    db.query(query, values, (err) => {
      if (err) {
        console.error('Database insert error:', err);
        return res.status(500).send('Error saving event');
      }

      res.status(200).send('Event successfully submitted');
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).send('Error uploading files');
  }
});

app.get('/events', async (req, res) => {
  const query = 'SELECT * FROM SmsEvents';

  try {
    db.query(query, (err, results) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).send('Error fetching events');
      }

      const events = results.map((event) => ({
        id: event.id,
        description: event.description,
        mediaUrls: JSON.parse(event.mediaUrls), // Parse media URLs back to array
      }));

      res.status(200).json(events);
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).send('Error fetching events');
  }
});
//comment







// Endpoint to get all books
app.get('/getBooks', (req, res) => {
  const query = 'SELECT * FROM Books';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching books:', err);
      res.status(500).json({ error: 'Error fetching books' });
    } else {
      res.status(200).json(results);
    }
  });
});


// Endpoint to search for books
app.get('/searchBook', (req, res) => {
  const query = req.query.query;
  
  // SQL query to search for books by title or ISBN
  const sqlQuery = `
    SELECT * FROM Books
    WHERE bookTitle LIKE ? OR isbn LIKE ?
  `;
  
  db.query(sqlQuery, [`%${query}%`, `%${query}%`], (err, results) => {
    if (err) {
      console.error('Error searching for books:', err);
      res.status(500).json({ error: 'Error searching for books' });
    } else {
      res.status(200).json(results);
    }
  });
});



// Post API to add a book and upload the cover photo to S3
app.post('/addBook', upload.single('coverPhoto'), (req, res) => {
  const { bookTitle, author, isbn, description } = req.body;
  const file = req.file;

  if (!bookTitle || !author || !isbn || !description || !file) {
    return res.status(400).json({ error: 'All fields and cover photo are required' });
  }

  // Upload file to AWS S3
  const fileName = Date.now().toString() + '-' + file.originalname;
  uploadToS3(file.buffer, fileName, 'smsbook-covers')
    .then((location) => {
      // Insert book details into the database after successful upload to S3
      const query = 'INSERT INTO Books (bookTitle, author, isbn, description, coverPhoto) VALUES (?, ?, ?, ?, ?)';
      
      db.query(query, [bookTitle, author, isbn, description, location], (err, result) => {
        if (err) {
          console.error('Error adding book to the database:', err);
          res.status(500).json({ error: 'Error adding book to the database' });
        } else {
          res.status(200).json({ message: 'Book added successfully', bookId: result.insertId });
        }
      });
    })
    .catch((error) => {
      console.error('Error uploading file to S3:', error);
      res.status(500).json({ error: 'Error uploading file to S3' });
    });
});




//Admin login code 
app.post('/adminlogin', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const sql = 'SELECT * FROM Admin WHERE email = ?';

  db.query(sql, [email], (err, data) => {
    if (err) {
      console.error("Error querying database:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (data.length > 0) {
      if (password === data[0].password) {
        req.session.email = email;
        res.json({ status: "Success" });
      } else {
        res.status(400).json({ message: "Password not matched" });
      }
    } else {
      res.status(400).json({ message: "Email not exists" });
    }
  });
});

//Api for number of student in the students table.
app.get('/studentCount',(req,res) =>{
  const sql = "SELECT COUNT(*) AS Student_Count FROM StudentDetails";

  db.query(sql,(err,result) =>{
    if(err){
      console.error("error querying database",err);
      return res.status(500).json({message:"Server Error"});
    }
    if(result.length>0){
      const count = result[0].Student_Count;
      res.json({Student_Count : count});
    }
    else{
      res.status(404).json({message:"Student details not found"});
    }
  });
});

//Api for number of teachers in the teacher table.
app.get('/teacherCount', (req, res) => {
  const sql = "SELECT COUNT(*) AS Teacher_Count FROM TeacherDetails";

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Error querying database:", err);
      return res.status(500).json({ message: "Server error" });
    }
    if (result.length > 0) {
      const count = result[0].Teacher_Count;
      res.json({ Teacher_Count: count });
    } else {
      res.status(404).json({ message: "Teacher details not found" });
    }
  });
});

//Api for Student Details
app.get('/studentDetails',(req,res)=>{
  const sql = 'SELECT * FROM StudentDetails';

  db.query(sql,(err,result)=>{
    if(err){
      console.error("error while feaching student details",err);
      return res.status(500).json({message:"Something unexpected has happend" + err});
    }
    res.json(result);
  });
});




// Fetch student data by admission ID
app.get('/studentModify/:admissionid', (req, res) => {
  const admissionid = req.params.admissionid;
  const query = 'SELECT fullname, section, className, rollNo,dateofbirth, fatherName, fatherNo, motherName, motherNo,email, presentAddress FROM StudentDetails WHERE admissionid = ?';
  db.query(query, [admissionid], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Server error');
    } else if (result.length === 0) {
      res.status(404).send('Student not found');
    } else {
      res.status(200).json(result[0]);
    }
  });
});

// Update student data by admission ID
app.put('/studentModify/:admissionid', (req, res) => {
  const admissionid = req.params.admissionid;
  const { fullname, section, className, rollNo,dateofbirth, fatherName, fatherNo, motherName, motherNo, presentAddress } = req.body;
  const query = 'UPDATE StudentDetails SET fullname = ?, section = ?, className = ?, rollNo = ?,dateofbirth = ?, fatherName = ?, fatherNo = ?, motherName = ?, motherNo = ?, presentAddress = ? WHERE admissionid = ?';
  db.query(query, [fullname, section, className, rollNo,dateofbirth, fatherName, fatherNo, motherName, motherNo, presentAddress, admissionid], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Server error');
    } else if (result.affectedRows === 0) {
      res.status(404).send('Student not found');
    } else {
      res.status(200).send('Student data updated successfully');
    }
  });
});

//Api to insert data in Feedetails
app.post('/feenews', (req, res) => {
  const { totalFees, paidAmount, remainingAmount, dueDate, admissionId } = req.body;

  const sql = 'INSERT INTO FeeDetails (totalFees, paidAmount, remainingAmount, dueDate, admissionId) VALUES (?, ?, ?, ?, ?)';
  const values = [totalFees, paidAmount, remainingAmount, dueDate, admissionId];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error inserting fee news:", err);
      return res.status(500).json({ message: "Something unexpected has occurred: " + err });
    }
    res.json({ success: "Fee news added successfully" });
  });
});

//Admin announcement
app.post('/announcements' ,(req,res) =>{
  const {subject, explanation ,reciver} = req.body;
  const sql = 'INSERT INTO Announcement (subject, explanation, reciver) VALUES (?,?,?)';
  const values = [subject,explanation,reciver];

  db.query(sql,values,(err,result) =>{
    if(err){
      console.error("Error inserting in announcement table",err);
      return res.status(500).json({message:"Something unexpected has happend" + err});
    }
  });
});

//api for teacher details
app.get('/teacherDetails',(req,res) =>{
  const sql = 'SELECT * FROM TeacherDetails';

  db.query(sql,(err,results) =>{
    if(err){
      console.error("Error while feching teacher details:", err);
      return res.status(500).json({message:"server error"});
    }
    res.json(results);
  });
});




//api for teacher name for timetable
app.get('/teacherName', (req, res) => {
  const sql = 'SELECT employeeid, fullname FROM TeacherDetails';
  db.query(sql, (err, result) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(result);
    }
  });
});


// API for new user registration
app.post('/register', (req, res) => {
  const { fullname, className, section, rollno, dateofbirth, email, fathername, fatherno, mothername, motherno, admissionid, presentaddress, password, confirmpassword } = req.body;

  if (!fullname || !className || !section || !rollno || !dateofbirth || !email || !fathername || !fatherno || !mothername || !motherno || !admissionid || !presentaddress || !password || !confirmpassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (password !== confirmpassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  bcrypt.hash(password.toString(), saltRounds, (err, hashedPassword) => {
    if (err) {
      console.error("Error hashing password:", err);
      return res.status(500).json({ message: "Server error" });
    }

    const sql = 'INSERT INTO StudentDetails (fullname, className, section, rollno, dateofbirth, email, fathername, fatherno, mothername, motherno, admissionid, presentaddress, password, confirmpassword) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [fullname, className, section, rollno, dateofbirth, email, fathername, fatherno, mothername, motherno, admissionid, presentaddress, hashedPassword, hashedPassword];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Error inserting user:", err);
        return res.status(500).json({ message: "Something unexpected has occurred: " + err });
      }
      res.json({ success: "Student added successfully" });
    });
  });
});

// API for Student Verification
app.post('/studentVerification', (req, res) => {
  const { admissionid, fullname , dateofbirth } = req.body;

  if (!admissionid || !fullname || !dateofbirth) {
    return res.status(400).json({ message: "Admission number, full name and Date of Birth  are required" });
  }

  const sql = 'SELECT * FROM StudentDetails WHERE admissionid = ? AND email IS NULL';

  db.query(sql, [admissionid], (err, data) => {
    if (err) {
      console.error("Error querying database:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (data.length > 0) {
      const student = data[0];
      if (student.fullname === fullname && student.dateofbirth === dateofbirth) {
        req.session.admissionid = admissionid; // Store admissionNo in session
        res.json({ status: "Success" });
      } else {
        res.status(400).json({ message: "Full name and dateofbirth does not match" });
      }
    } else {
      res.status(400).json({ message: "Admission number not found" });
    }
  });
});

// API endpoint for updating student email, password, and confirmPassword
app.post('/studentRegister', (req, res) => {
  const { email, password, confirmPassword } = req.body;
  const admissionid = req.query.admissionid;
  
  // Update query to set email, password, and confirmPassword where admissionNo matches
  const sql = 'UPDATE StudentDetails SET email = ?, password = ?, confirmPassword = ? WHERE admissionid = ?';
  
  db.query(sql, [email, password, confirmPassword, admissionid], (err, result) => {
    if (err) {
      console.error('Error updating student details:', err);
      res.status(500).json({ message: 'Failed to update student details' });
    } else {
      console.log('Student details updated successfully');
      res.status(200).json({ message: 'Student details updated successfully' });
    }
  });
});

// API for Student Verification
app.post('/studentForgotPassword', (req, res) => {
  const { admissionid, fullname , dateofbirth, email } = req.body;

  if (!admissionid || !fullname || !dateofbirth || !email) {
    return res.status(400).json({ message: "Admission number, full name , email and Date of Birth  are required" });
  }

  const sql = 'SELECT * FROM StudentDetails WHERE admissionid = ?';

  db.query(sql, [admissionid], (err, data) => {
    if (err) {
      console.error("Error querying database:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (data.length > 0) {
      const student = data[0];
      if (student.fullname === fullname && student.dateofbirth === dateofbirth  && student.email === email) {
        req.session.admissionid = admissionid; // Store admissionNo in session
        res.json({ status: "Success" });
      } else {
        res.status(400).json({ message: "Full name and dateofbirth does not match" });
      }
    } else {
      res.status(400).json({ message: "Admission number not found" });
    }
  });
});

//Student Password Change
// API endpoint for updating student email, password, and confirmPassword
app.post('/changePassword', (req, res) => {
  const {password, confirmPassword } = req.body;
  const admissionid = req.query.admissionid;
  
  // Update query to set email, password, and confirmPassword where admissionNo matches
  const sql = 'UPDATE StudentDetails SET password = ?, confirmPassword = ? WHERE admissionid = ?';
  
  db.query(sql, [password, confirmPassword, admissionid], (err, result) => {
    if (err) {
      console.error('Error updating student details:', err);
      res.status(500).json({ message: 'Failed to update student details' });
    } else {
      console.log('Student details updated successfully');
      res.status(200).json({ message: 'Student details updated successfully' });
    }
  });
});


//Api for Student login
app.post('/loginpage', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const sql = 'SELECT * FROM StudentDetails WHERE email = ?';

  db.query(sql, [email], (err, data) => {
    if (err) {
      console.error("Error querying database:", err);
      return res.status(500).json({ message: "Server error" });
    }
    if (data.length > 0) {
      const student = data[0];
        if (student.password === password) {
          req.session.email = email;
          res.json({ status: "Success" });
        } else {
          res.status(400).json({ message: "Password not matched" });
        }
    } else {
      res.status(400).json({ message: "Email not exists" });
    }
  });
});



// api for student leaves 
app.post('/studentLeave', (req, res) => {
  const { fullname, className, section,email, recipient, leavePurpose, startDate, endDate, description } = req.body;

  const sql = 'INSERT INTO StudentLeave (fullname, className, section,email, recipient, leavePurpose, startDate, endDate, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [fullname, className, section,email, recipient, leavePurpose, startDate, endDate, description];

  db.query(sql, values, (err, data) => {
    if (err) {
      console.error("error inserting in the student leave table:", err);
      return res.status(500).json({ message: "something unexpected has happend:" + err });
    }
    res.json({ success: "leave letter send succesfully" });
  });
});

//api for fetching student leaves 
app.get('/studentLeaveList', (req, res) => {
  const  email  = req.query.email;

  const sql = "SELECT * FROM StudentLeave WHERE email = ?";

  db.query(sql, [email], (err, results) => {
      if (err) {
          console.error("Error while getting the data", err);
          return res.status(500).json({ message: "Error while fetching data", error: err });
      }
      res.json(results);
  });
});


//Api for notifications about homework
app.get('/Homeworklist',(req,res) =>{
  const sql = 'Select * FROM TeacherHomework';

  db.query(sql,(err,results) =>{
    if(err){
      console.error("error while feaching the homework",err);
      return res.status(500).json({message:"server Error"});
    }
    res.json(results);
  });
});

// Fee details fetch API
app.get('/feedetails', (req, res) => {
  const admissionid = req.query.admissionid;

  if (!admissionid) {
    return res.status(400).json({ error: "Admission ID is required" });
  }

  const sql = "SELECT * FROM FeeDetails WHERE admissionid = ?";

  db.query(sql, [admissionid], (err, data) => {
    if (err) {
      console.error("Error querying database:", err);
      return res.status(500).json({ error: "Fee details fetch error" });
    }
    if (data.length > 0) {
      const userFee = data[0];
      return res.json(userFee);
    } else {
      return res.status(404).json({ error: "Fee details not found" });
    }
  });
});

// API for fetching student timetable
app.get('/studentTimetable', (req, res) => {
  const { className, section } = req.query; // Assuming className and section are passed as query parameters

  if (!className || !section) {
    return res.status(400).json({ message: "Class name and section are required" });
  }

  const sql = 'SELECT * FROM TimeTable WHERE className = ? AND section = ?';
  const values = [className, section];

  db.query(sql, values, (err, results) => {
    if (err) {
      console.error("Error fetching student timetable:", err);
      return res.status(500).json({ message: "Server error" });
    }
    res.json(results);
  });
});

//API for getting teacher data from teacher table for timetable
app.get('/teacherData', (req, res) => {
  const { employeeid } = req.query;
  const sql = 'SELECT fullname, subject,qualification,experience,employeeid FROM TeacherDetails WHERE employeeid = ?';
  db.query(sql, [employeeid], (err, result) => {
    if (err) {
      console.error('Error fetching teacher details:', err);
      res.status(500).json({ error: 'Failed to fetch teacher details' });
    } else {
      if (result.length > 0) {
        res.json(result[0]); // Assuming employeeId is unique, so returning the first result
      } else {
        res.status(404).json({ error: 'Teacher details not found' });
      }
    }
  });
});

// API endpoint to fetch homework data
app.get('/studentHomework/:className/:section', (req, res) => {
  const { className, section } = req.params;
  const query = `
    SELECT *
    FROM TeacherHomework
    WHERE classname = ? AND section = ?
  `;
  
  db.query(query, [className, section], (err, results) => {
    if (err) {
      console.error('Error fetching homework data:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    
    res.json(results);
  });
});

//Api for inserting in student Complaint table
app.post('/studentComplaint', (req, res) => {
  const { fullname, className, section, recipient, typeOfComplaint, reason, explanation } = req.body;

  const sql = 'INSERT INTO StudentComplaint (fullname, className, section, recipient, typeOfComplaint, reason, explanation) VALUES (?, ?, ?, ?, ?, ?, ?)';
  const values = [fullname, className, section, recipient, typeOfComplaint, reason, explanation];

  db.query(sql, values, (err, data) => {
    if (err) {
      console.error("error inserting in the student complaint table", err);
      return res.status(500).json({ message: "something unexpected has happend:" + err });
    }
    res.json({ success: "complaint letter send succesfully" });
  });
});

// Endpoint to get student exam results
app.get('/studentExamResults', (req, res) => {
  const { fullname, className, section, examType } = req.query;

  const sql = 'SELECT subject, marks FROM ExamResults WHERE fullname = ? AND className = ? AND section = ? AND examType = ?';
  db.query(sql, [fullname, className, section, examType], (err, results) => {
    if (err) {
      console.error('Error fetching exam results:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    res.json(results);
  });
});

// API endpoint to fetch studymatrial  data
app.get('/studentStudyMaterial/:className/:section', (req, res) => {
  const { className, section } = req.params;
  const query = `
    SELECT *
    FROM StudyMaterial
    WHERE className = ? AND section = ?
  `;
  
  db.query(query, [className, section], (err, results) => {
    if (err) {
      console.error('Error fetching homework data:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    
    res.json(results);
  });
});


//api for reciving announcements.
app.get('/reciveAnnouncements', (req, res) => {
  const reciver = req.query.reciver; // Assuming "reciver" is a typo for "receiver"
  const sql = 'SELECT * FROM Announcement WHERE reciver = ? ';
  db.query(sql, [reciver], (err, results) => {
    if (err) {
      console.error("Error while fetching announcements", err);
      return res.status(500).json({ message: "Server error" });
    }
    res.json(results);
  });
});

// API for fetching homework based on student's full name, class, and section
app.get('/studentHomeworkNotification', (req, res) => {
  const { className, section } = req.query;
  const sql = 'SELECT * FROM TeacherHomework WHERE className = ? AND section = ?';
  db.query(sql, [className, section], (err, results) => {
    if (err) {
      console.error("Error while fetching homework:", err);
      return res.status(500).json({ message: "Server error" });
    }
    res.json(results);
  });
});

// API for fetching complaint responses based on student's full name, class, and section
app.get('/complaintResponse', (req, res) => {
  const { fullname, className, section } = req.query;
  const sql = 'SELECT * FROM StudentComplaint WHERE fullname = ? AND className = ? AND section = ? AND is_resolved = 1';
  db.query(sql, [fullname, className, section], (err, results) => {
    if (err) {
      console.error("Error while fetching complaint responses:", err);
      return res.status(500).json({ message: "Server error" });
    }
    res.json(results);
  });
});

//api for fetching student leaves 
app.get('/studentLeaveNotification', (req, res) => {
  const  email  = req.query.email;

  const sql = "SELECT * FROM StudentLeave WHERE email = ? AND approval IS NOT NULL";

  db.query(sql, [email], (err, results) => {
      if (err) {
          console.error("Error while getting the data", err);
          return res.status(500).json({ message: "Error while fetching data", error: err });
      }
      res.json(results);
  });
});

// API for Teacher Verification
app.post('/teacherVerification', (req, res) => {
  const { employeeid, fullname , dateofbirth } = req.body;

  if (!employeeid || !fullname || !dateofbirth) {
    return res.status(400).json({ message: "Employee Id, full name and Date of Birth  are required" });
  }

  const sql = 'SELECT * FROM TeacherDetails WHERE employeeid = ?';

  db.query(sql, [employeeid], (err, data) => {
    if (err) {
      console.error("Error querying database:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (data.length > 0) {
      const teacher = data[0];
      if (teacher.fullname === fullname && teacher.dateofbirth === dateofbirth) {
        req.session.employeeid = employeeid; // Store admissionNo in session
        res.json({ status: "Success" });
      } else {
        res.status(400).json({ message: "Full name and dateofbirth does not match" });
      }
    } else {
      res.status(400).json({ message: "Employee Id  not found" });
    }
  });
});

// API endpoint for updating student email, password, and confirmPassword
app.post('/teachersRegister', (req, res) => {
  const { email, password, confirmPassword } = req.body;
  const employeeid = req.query.employeeid;
  
  // Update query to set email, password, and confirmPassword where admissionNo matches
  const sql = 'UPDATE TeacherDetails SET email = ?, password = ?, confirmPassword = ? WHERE employeeid = ?';
  
  db.query(sql, [email, password, confirmPassword, employeeid], (err, result) => {
    if (err) {
      console.error('Error updating student details:', err);
      res.status(500).json({ message: 'Failed to update student details' });
    } else {
      console.log('Teacher details updated successfully');
      res.status(200).json({ message: 'Teacher details updated successfully' });
    }
  });
});

// API for teacher forgot password Verification
app.post('/teacherForgotPassword', (req, res) => {
  const { employeeid, fullname , dateofbirth, email } = req.body;

  if (!employeeid || !fullname || !dateofbirth || !email) {
    return res.status(400).json({ message: "Employee Id, full name , email and Date of Birth  are required" });
  }

  const sql = 'SELECT * FROM TeacherDetails WHERE employeeid = ?';

  db.query(sql, [employeeid], (err, data) => {
    if (err) {
      console.error("Error querying database:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (data.length > 0) {
      const teacher = data[0];
      if (teacher.fullname === fullname && teacher.dateofbirth === dateofbirth  && teacher.email === email) {
        req.session.employeeid = employeeid; // Store admissionNo in session
        res.json({ status: "Success" });
      } else {
        res.status(400).json({ message: "Full name and dateofbirth does not match" });
      }
    } else {
      res.status(400).json({ message: "Employee Id does not found" });
    }
  });
}); 

//Teacher Password Change
// API endpoint for updating Teacher email, password, and confirmPassword
app.post('/teacherChangePassword', (req, res) => {
  const {password, confirmPassword } = req.body;
  const employeeid = req.query.employeeid;
  
  // Update query to set email, password, and confirmPassword where employeeid matches
  const sql = 'UPDATE TeacherDetails SET password = ?, confirmPassword = ? WHERE employeeid = ?';
  
  db.query(sql, [password, confirmPassword, employeeid], (err, result) => {
    if (err) {
      console.error('Error updating student details:', err);
      res.status(500).json({ message: 'Failed to update student details' });
    } else {
      console.log('Teacher details updated successfully');
      res.status(200).json({ message: 'Teacher details updated successfully' });
    }
  });
});

//Api for Teacher Login
app.post('/teacherlogin', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const sql = 'SELECT * FROM TeacherDetails WHERE email = ?';

  db.query(sql, [email], (err, data) => {
    if (err) {
      console.error("Error querying database:", err);
      return res.status(500).json({ Error: "Login error in server" });
    }
    if (data.length > 0) {
      const teacher = data[0];
        if (teacher.password === password) {
          req.session.email = email; // Save email in session
          res.json({ Status: "Success" });
        } else {
          return res.status(400).json({ Error: "Password not matched" });
        }
    } else {
      return res.status(400).json({ Error: "Email not exists" });
    }
  });
});



// New API for updating teacher details
app.post('/teacherUpdate', (req, res) => {
  const { profile, email } = req.body;

  if (!profile || !email) {
    return res.status(400).json({ message: "Invalid input" });
  }

  // Construct the SQL query to update the profile
  const fields = Object.keys(profile).map(field => `${field} = ?`).join(', ');
  const values = Object.values(profile).concat(email);

  const sql = `UPDATE TeacherDetails SET ${fields} WHERE email = ?`;

  // Execute the query with the provided values
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error updating teacher details:", err);
      return res.status(500).json({ message: "Something unexpected has occurred: " + err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.json({ success: "Teacher details updated successfully" });
  });
});

//teacher homework api
app.post('/teacherHomework', (req,res) =>{

  const {className,section,subject,typeOfHomework,title,duration,homework,email} =req.body;

  const sql= 'INSERT INTO TeacherHomework (className,section,subject,typeOfHomework,title,duration,homework,email) VALUES (?,?,?,?,?,?,?,?)';
  const values = [className,section,subject,typeOfHomework,title,duration,homework,email];

  db.query(sql,values,(err,result) =>{
    if(err){
      console.error("Error inserting in teacher homework screen" ,err);
      return res.status(500).json({message:"something unexpected has happed:"+ err});
    }
    res.json({success:"homework send successfully"});
  });
});

//api for getting teacher homwwork list
app.get('/teacherHomeworkList',(req,res) =>{
  const email = req.query.email;

  const sql = "SELECT * FROM TeacherHomework WHERE email =?";
  db.query(sql,[email],(err,results)=>{
    if(err){
      console.error("error while fetching teacher Homework",err);
    }
    res.json(results);
  });
});

// API for submitting attendance
app.post('/attendance', (req, res) => {
  const attendanceData = req.body;

  if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
    return res.status(400).json({ message: "Invalid attendance data" });
  }

  const values = attendanceData.map(({ rollNo, date, subject, status, className, section }) => [rollNo, date, subject, status, className, section]);

  const sql = 'INSERT INTO Attendance (rollNo, date, subject, status, className, section) VALUES ?';

  db.query(sql, [values], (err, result) => {
    if (err) {
      console.error("Error inserting attendance:", err);
      return res.status(500).json({ message: "Something unexpected has occurred: " + err });
    }
    res.json({ success: "Attendance submitted successfully" });
  });
});

// fetch attendance data
app.get('/prevAttendance', (req, res) => {
  const { className, section, date, subject } = req.query;

  const query = `
    SELECT rollNo, status 
    FROM Attendance 
    WHERE className = ? AND section = ? AND date = ? AND subject = ?`;

  db.query(query, [className, section, date, subject], (err, results) => {
    if (err) {
      console.error('Error fetching attendance data:', err);
      res.status(500).send('Error fetching attendance data');
      return;
    }
    res.json(results);
  });
});

//api for Teacher Complaints
app.post('/TeacherComplaints', (req, res) => {
  const { employeeid, typeOfComplaint, reason, explanation } = req.body;

  const sql = 'INSERT INTO TeacherComplaint (employeeid, typeOfComplaint, reason, explanation) VALUES  (?,?,?,?)';
  const values = [employeeid, typeOfComplaint, reason, explanation];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error inserting in teacher complaint", err);
      return res.status(500).json({ message: "Something unexpected has happend:" + err });
    }
  });
});

//api for teacher complaint list
app.get('/teacherComplaintList',(req,res) => {
  const employeeid = req.query.employeeid;
  const sql = "SELECT * FROM TeacherComplaint WHERE employeeid = ? ";
  db.query(sql,[employeeid],(err,results) =>{
    if(err){
      onsole.error("Error while fetching teacher complaints", err);
      return res.status(500).json({ message: "Something unexpected has happened: " + err });
    }
    res.json(results);
  });
});


//student details with the help of classname and section
app.get('/studentResults', (req, res) => {
  const { className, section } = req.query;

  const sql = "SELECT * FROM StudentDetails WHERE className = ? AND section = ?";
  const values = [className, section];

  db.query(sql, values, (err, data) => {
    if (err) {
      console.error("Error fetching student details:", err);
      return res.status(500).json({ message: "Error fetching student details" });
    }
    res.status(200).json(data);
  });
});



//api for teacher leave inserting
app.post('/teacherLeave', (req, res) => {
  const { employeeid,email, purpose, startdate, enddate, description } = req.body;

  const sql = 'INSERT INTO TeacherLeave (employeeid,email, purpose, startdate, enddate, description) VALUES (?, ?, ?, ?, ?,?)';
  const values = [employeeid,email, purpose, startdate, enddate, description];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error inserting in teacher leave:", err);
      return res.status(500).json({ message: "Something unexpected has occurred: " + err });
    }
    res.json({ success: "Leave Letter sent successfully" });
  });
});

//list of single student Complaint.
app.get('/studentComplaintList', (req, res) => {
  const { fullname, className, section } = req.query;

  const sql = "SELECT * FROM StudentComplaint WHERE fullname = ? AND className = ? AND section = ?";
  db.query(sql, [fullname, className, section], (err, results) => {
    if (err) {
      console.error("Error while fetching student complaints", err);
      return res.status(500).json({ message: "Something unexpected has happened: " + err });
    }
    res.json(results);
  });
});

//api to insert results in the table.
app.post('/teacherExamResults', (req, res) => {
  const marksData = req.body; // Assuming marksData is an array of objects

  if (!marksData || !Array.isArray(marksData)) {
      return res.status(400).json({ message: "Invalid marks data provided" });
  }

  // Assuming marksData is an array of objects with keys matching column names
  const sql = "INSERT INTO ExamResults (className, section, examType, subject, rollNo, fullname, marks, employeeid) VALUES ?";
  const values = marksData.map(data => [data.className, data.section, data.examType, data.subject, data.rollNo, data.fullname, data.marks, data.employeeid]);

  db.query(sql, [values], (err, results) => {
      if (err) {
          console.error("Error inserting marks:", err);
          return res.status(500).json({ message: "Failed to insert marks into database" });
      }
      console.log("Marks inserted successfully");
      res.status(200).json({ message: "Marks inserted successfully" });
  });
});

// Define the route to fetch previous results data
app.get('/prevResults', (req, res) => {
  const { className, section, examType, subject } = req.query;

  const query = `
    SELECT fullname , rollNo, marks 
    FROM ExamResults 
    WHERE className = ? AND section = ? AND examType = ? AND subject = ?`;

  db.query(query, [className, section, examType, subject], (err, results) => {
    if (err) {
      console.error('Error fetching attendance data:', err);
      res.status(500).send('Error fetching attendance data');
      return;
    }
    res.json(results);
  });
});


// Api for getting complaints from Students
app.get('/complaints', (req, res) => {
  const recipient = req.query.recipient;

  if (!recipient) {
    return res.status(400).json({ message: "Recipient not specified" });
  }

  const sql = 'SELECT * FROM StudentComplaint WHERE recipient = ?';
  
  db.query(sql, [recipient], (err, results) => {
    if (err) {
      console.error("Error fetching complaints:", err);
      return res.status(500).json({ message: "Server error" });
    }
    res.json(results);
  });
});

// Api for getting notification complaints from Students
app.get('/notificationComplaints', (req, res) => {
  const recipient = req.query.recipient;

  if (!recipient) {
    return res.status(400).json({ message: "Recipient not specified" });
  }

  const sql = 'SELECT * FROM StudentComplaint WHERE recipient = ? AND is_resolved = 0';
  
  db.query(sql, [recipient], (err, results) => {
    if (err) {
      console.error("Error fetching complaints:", err);
      return res.status(500).json({ message: "Server error" });
    }
    res.json(results);
  });
});

//api for teacher leave conformation
app.get('/leaveNotification', (req, res) => {
  const email = req.query.email; // Corrected from req.query.params to req.query.email
  const sql = "SELECT * FROM TeacherLeave WHERE email = ? AND approval IS NOT NULL";
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("Error while fetching teacher leaves", err);
      return res.status(500).json({ error: "Error while fetching teacher leaves" }); // Return an error response
    }
    res.json(results);
  });
});

//api for teacher leave list
app.get('/teacherLeaveList', (req, res) => {
  const email = req.query.email; // Corrected from req.query.params to req.query.email
  const sql = "SELECT * FROM TeacherLeave WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("Error while fetching teacher leaves", err);
      return res.status(500).json({ error: "Error while fetching teacher leaves" }); // Return an error response
    }
    res.json(results);
  });
});

//api for teacher time table.
app.get('/teacherTimetable', (req, res) => {
  let employeeid = req.query.employeeid;
  let sql = `SELECT * FROM TimeTable WHERE employeeid = ?`;
  db.query(sql, [employeeid], (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});


//api for teacher Study material
app.post('/teacherStudyMaterial',(req,res) =>{
  const {className, section , subject , topic , explanation , email} = req.body;

  const sql = "INSERT INTO StudyMaterial (className, section , subject , topic , explanation , email) VALUES (?,?,?,?,?,?)";
  const values = [className, section , subject , topic , explanation , email];

  db.query(sql,values,(err,results) =>{
    if(err){
      console.error('Error inserting study material:', err);
      res.status(500).json({ message: 'Failed to insert study material' });
    }else {
      console.log('Study material inserted successfully');
      res.status(200).json({ message: 'Study Material inserted successfully' });
    }
  });
});




//api for student leaves showing
app.get('/studentLeaves', (req,res) =>{
  
  const sql = "SELECT * FROM StudentLeave ";

  db.query(sql,(err,result) =>{
    if(err){
      console.error("error while fetching student leaves" ,err);
      return res.status(500).json({message:"Something unexpected had happend" + err});
    }
    res.json(result);
  });
});






// Update approval status of a leave request
app.put('/studentLeaves/:id', (req, res) => {
  const { id } = req.params;
  const { approval } = req.body;
  const sql = 'UPDATE StudentLeave SET approval = ? WHERE id = ?';
  db.query(sql, [approval, id], (err, results) => {
      if (err) {
          console.error('Error updating leave status:', err);
          res.status(500).json({ error: 'Failed to update leave status' });
          return;
      }
      res.json({ message: 'Leave status updated' });
  });
});

//api for geting teacher leave details
app.get('/teacherLeaves',(req,res) =>{
  
  const sql = "SELECT * FROM TeacherLeave";
  db.query(sql,(err,results) =>{
    if(err){
      console.error("error while fetching teacher leave data" ,err);
      return res.status(500).json({error: "failed to load teacher details"});
    }
    res.json(results);
  });
});

//api for updating teacher leave approval 
app.put('/teacherLeaves/:id',(req,res) =>{
  const {id} = req.params;
  const {approval} = req.body;
  const sql = "UPDATE TeacherLeave SET approval = ? WHERE id =?";
  db.query(sql, [approval, id], (err, results) => {
    if (err) {
        console.error('Error updating leave status:', err);
        res.status(500).json({ error: 'Failed to update leave status' });
        return;
    }
    res.json({ message: 'Leave status updated' });
  });
});





app.get('/leaveProfile', (req, res) => {
  const email = req.query.email;
  const sql = 'SELECT fullname,className,section  FROM StudentDetails WHERE email = ?';
  db.query(sql, [email], (err, data) => {
    if (err) {
      console.error("error querying database:", err);
      return res.json({ Error: "profile feach error" });
    }
    if (data.length > 0) {
      const userLeaveProfile = data[0];
      return res.json(userLeaveProfile);
    } else {
      return res.json({ Error: "profile not found" });
    }
  });
});





// Api for getting single student complaints from Students
app.get('/singleStudentComplaint', (req, res) => {
  const {fullname , className ,section,recipient} = req.query

  if (!recipient || !fullname || !className || !section) {
    return res.status(400).json({ message: "Recipient , full name , class name , section not specified" });
  }

  const sql = 'SELECT * FROM StudentComplaint WHERE fullname = ? AND className = ? AND section = ? AND recipient = ? ';
  
  db.query(sql, [fullname, className , section , recipient], (err, results) => {
    if (err) {
      console.error("Error fetching complaints:", err);
      return res.status(500).json({ message: "Server error" });
    }
    res.json(results);
  });
});

// Endpoint to resolve a complaint
app.put('/complaints/:id/resolve', (req, res) => {
  const complaintId = req.params.id;
  const { is_resolved, comments } = req.body;

  const sql = 'UPDATE StudentComplaint SET is_resolved = ?, comments = ? WHERE id = ?';
  db.query(sql, [is_resolved, comments, complaintId], (err, result) => {
    if (err) {
      console.error("Error resolving complaint:", err);
      return res.status(500).json({ message: "Server error" });
    }
    res.json({ status: 'Success', message: "Complaint resolved successfully" });
  });
});





//Api for teacher ComplainsScreen on admin screen
app.get('/teacherComplaints',(req,res) =>{
  const sql = 'SELECT * FROM TeacherComplaint ';

  db.query(sql,(err,results) =>{
    if(err){
      console.error("Error feaching teacher complaints:", err);
      return res.status(500).json({message:"Server Error"});
    }
    res.json(results);
  });
});

// Endpoint to resolve Teacher complaint
app.put('/teacherComplaints/:id/resolve', (req, res) => {
  const complaintId = req.params.id;
  const { is_resolved, comments } = req.body;

  const sql = 'UPDATE TeacherComplaint SET is_resolved = ?, comments = ? WHERE id = ?';
  db.query(sql, [is_resolved, comments, complaintId], (err, result) => {
    if (err) {
      console.error("Error resolving complaint:", err);
      return res.status(500).json({ message: "Server error" });
    }
    res.json({ success: "Complaint resolved successfully" });
  });
});




// Endpoint to add questions
app.post('/questions', (req, res) => {
  const { className, section, questions, subject,employeeid } = req.body;

  // Validate input
  if (!className || !section ||!subject ||!employeeid || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).send('Invalid input data');
  }

  // Prepare SQL query and values
  const sql = 'INSERT INTO Questions (className, section,subject,employeeid, question, options, correctAnswer) VALUES ?';
  const values = questions.map(q => [className, section,subject,employeeid, q.question, JSON.stringify(q.options), q.correctAnswer]);

  db.query(sql, [values], (err, result) => {
    if (err) {
      console.error('Database query failed:', err);
      return res.status(500).send('Failed to add questions');
    }
    res.status(201).send('Questions added successfully');
  });
});

app.get('/questions', (req, res) => {
  const { className, section } = req.query;

  if (!className || !section) {
    return res.status(400).send('Class and section are required');
  }

  const sql = 'SELECT id, question, options, correctAnswer FROM Questions WHERE className = ? AND section = ?';
  db.query(sql, [className, section], (err, results) => {
    if (err) {
      console.error('Database query failed:', err);
      return res.status(500).send('Failed to fetch questions');
    }

    // Parse the options from JSON format
    const questions = results.map(question => ({
      ...question,
      options: JSON.parse(question.options)
    }));

    res.status(200).json(questions);
  });
});

app.get('/studentQuestions', (req, res) => {
  const { className, section, subject } = req.query;

  const query = `SELECT * FROM Questions WHERE className = ? AND section = ? AND subject = ?`;
  db.query(query, [className, section, subject], (err, rows) => {
      if (err) {
          console.error(err.message);
          return res.status(500).json({ error: 'Failed to fetch questions' });
      }

      if (rows.length === 0) {
          return res.status(404).json({ message: 'No questions found' });
      }

      // Parse options JSON for each question
      rows.forEach(row => {
          row.options = JSON.parse(row.options);
      });

      res.json(rows);
  });
});

app.get('/subjects', (req, res) => {
  const { className, section } = req.query;

  if (!className || !section) {
      return res.status(400).json({ error: 'className and section are required' });
  }

  const query = `SELECT DISTINCT subject FROM Questions WHERE className = ? AND section = ?`;
  db.query(query, [className, section], (err, results) => {
      if (err) {
          console.error('Error executing query:', err.message);
          return res.status(500).json({ error: 'Failed to fetch subjects' });
      }

      console.log('Query results:', results); // Log results for debugging

      if (results.length === 0) {
          return res.status(404).json({ message: 'No subjects found' });
      }

      const subjects = results.map(row => row.subject);
      res.json(subjects);
  });
});


app.post('/submit', (req, res) => {
  const { answers, email } = req.body;

  if (!answers || !email) {
    return res.status(400).send('Invalid input data');
  }

  const getClassSectionSql = 'SELECT className, section FROM StudentDetails WHERE email = ?';
  db.query(getClassSectionSql, [email], (err, results) => {
    if (err) {
      console.error('Database query failed:', err);
      return res.status(500).send('Failed to fetch profile');
    }

    if (results.length === 0) {
      return res.status(404).send('Student not found');
    }

    const { className, section } = results[0];

    const getQuestionsSql = 'SELECT id, correctAnswer FROM Questions WHERE className = ? AND section = ?';
    db.query(getQuestionsSql, [className, section], (err, questions) => {
      if (err) {
        console.error('Database query failed:', err);
        return res.status(500).send('Failed to fetch questions');
      }

      let score = 0;
      let totalQuestions = questions.length;
      let incorrectAnswers = 0;

      questions.forEach(question => {
        if (answers[question.id] === question.correctAnswer) {
          score++;
        } else {
          incorrectAnswers++;
        }
      });

      res.status(200).json({ score, totalQuestions, incorrectAnswers });
    });
  });
});

// API for retrieving attendance summary
app.get('/attendance/summary', (req, res) => {
  const { rollNo, startDate, endDate, className, section } = req.query;

  const conditions = [];
  const values = [];

  if (rollNo) {
    conditions.push("rollno = ?");
    values.push(rollNo);
  }
  if (startDate) {
    conditions.push("date >= ?");
    values.push(startDate);
  }
  if (endDate) {
    conditions.push("date <= ?");
    values.push(endDate);
  }
  if (className) {
    conditions.push("className = ?");
    values.push(className);
  }
  if (section) {
    conditions.push("section = ?");
    values.push(section);
  }

  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

  const sql = `
    SELECT 
      COUNT(*) AS totalDays,
      SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS totalPresent,
      SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS totalAbsent,
      SUM(CASE WHEN status = 'Holiday' THEN 1 ELSE 0 END) AS totalHolidays,
      COUNT(*) - SUM(CASE WHEN status = 'Holiday' THEN 1 ELSE 0 END) AS totalWorkingDays
    FROM Attendance
    ${whereClause}
  `;

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error retrieving attendance summary:", err);
      return res.status(500).json({ message: "Something unexpected has occurred: " + err });
    }
    res.json(result[0]);
  });
});



// Endpoint to update book status
app.post('/updateBookStatus', (req, res) => {
  const { bookId, status } = req.body;
  const sql = `UPDATE Books SET status = ? WHERE id = ?`;
  db.query(sql, [status, bookId], (err, result) => {
      if (err) {
          console.error('Error updating book status:', err);
          res.status(500).json({ error: 'Failed to update book status' });
      } else {
          res.json({ message: `Book status updated to ${status}` });
      }
  });
});



// API to fetch student attendance based on roll number, class, and section
app.get('/studentAttendance', (req, res) => {
  const { rollNo, className, section } = req.query;
  if (!rollNo || !className || !section) {
    return res.status(400).json({ error: 'Roll number, class name, and section are required' });
  }

  const query = 'SELECT date, status FROM Attendance WHERE rollNo = ? AND className = ? AND section = ?';
  db.query(query, [rollNo, className, section], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database query failed' });
    }

    res.json(results);
  });
});

//api for student details using admission number

app.get('/getStudentDetails', (req, res) => {
    const { admissionid } = req.query;

    // Check if admissionid is provided
    if (!admissionid) {
        return res.status(400).send('Admission ID is required');
    }

    const query = `SELECT fullname, className, section FROM StudentDetails WHERE admissionid = ?`;
    db.query(query, [admissionid], (err, result) => {
        if (err) {
            console.error('Error fetching student details', err);
            return res.status(500).send('Error fetching student details');
        }

        // Check if a student was found
        if (result.length === 0) {
            return res.status(404).send('Student not found');
        }

        res.send(result[0]);
    });
});

// API to get teacher details by email
app.get('/employee', (req, res) => {
  const { email } = req.query;
  const query = 'SELECT employeeid FROM TeacherDetails WHERE email = ?';

  db.query(query, [email], (error, results) => {
    if (error) {
      console.error('Error fetching employee ID:', error);
      res.status(500).send('Error fetching employee ID');
      return;
    }

    if (results.length === 0) {
      res.status(404).send('Employee not found');
      return;
    }

    res.json(results[0]);
  });
});



//api for alocating the book
app.post('/allocateBook', (req, res) => {
  const { bookId, admissionid, fullname, className, section, allocationDate } = req.body;
  const query = `INSERT INTO LibraryManagement (bookId, admissionid, fullname, className, section, allocationDate) VALUES (${bookId}, ${admissionid}, '${fullname}', '${className}', '${section}', '${allocationDate}')`;
  db.query(query, (err, result) => {
      if (err) {
          console.error('Error allocating book', err);
          return res.status(500).send('Error allocating book');
      }

      const updateQuery = `UPDATE Books SET status = 'Allocated' WHERE id = ${bookId}`;
      db.query(updateQuery, (err, result) => {
          if (err) {
              console.error('Error updating book status', err);
              return res.status(500).send('Error updating book status');
          }
          res.send('Book allocated successfully');
      });
  });
});


//api for library details
app.get('/getLibraryManagementDetails', (req, res) => {
  const { bookId } = req.query;
  
  if (!bookId) {
      return res.status(400).send('bookId is required');
  }
  
  const query = `
      SELECT bookId, admissionid, fullname, className, section, allocationDate
      FROM LibraryManagement
      WHERE bookId = ?
      ORDER BY id DESC
      LIMIT 1
  `;
  
  db.query(query, [bookId], (err, results) => {
      if (err) {
          console.error('Error fetching library management details', err);
          return res.status(500).send('Error fetching library management details');
      }
      
      if (results.length > 0) {
          // Assuming results[0] is a flat object
          res.json(results[0]);
      } else {
          res.status(404).send('No records found for the given bookId');
      }
  });
});

//api for return  books
app.post('/returnBook', (req, res) => {
  const { bookId, admissionid, returnDate, remarks } = req.body;
  
  if (!bookId || !admissionid || !returnDate) {
      return res.status(400).send('bookId, admissionid, and returnDate are required');
  }

  const updateQuery = `
      UPDATE LibraryManagement 
      SET returnDate = ?, remarks = ?
      WHERE bookId = ? AND admissionid = ?
  `;
  
  db.query(updateQuery, [returnDate, remarks, bookId, admissionid], (err, result) => {
      if (err) {
          console.error('Error returning book', err);
          return res.status(500).send('Error returning book');
      }

      const updateBookQuery = `
          UPDATE Books 
          SET status = 'Available' 
          WHERE id = ?
      `;
      
      db.query(updateBookQuery, [bookId], (err, result) => {
          if (err) {
              console.error('Error updating book status', err);
              return res.status(500).send('Error updating book status');
          }
          res.send('Book returned successfully');
      });
  });
});

// Get special dates
app.get('/getSpecialDates', (req, res) => {
  const sql = 'SELECT * FROM Special_Dates';
  db.query(sql, (err, results) => {
      if (err) {
          res.status(500).send({ error: 'Failed to fetch special dates' });
      } else {
          res.json(results);
      }
  });
});


// Add special date
app.post('/addSpecialDate', (req, res) => {
  const { date, description } = req.body;

  if (!date || !description) {
      return res.status(400).send({ error: 'Date and description are required' });
  }

  const sql = 'INSERT INTO Special_Dates (date, description) VALUES (?, ?)';
  db.query(sql, [date, description], (err, results) => {
      if (err) {
          res.status(500).send({ error: 'Failed to add special date' });
      } else {
          res.json({ message: 'Special date added successfully' });
      }
  });
});

// Fetch Teacher Data
app.get('/teacherModify/:employeeid', (req, res) => {
  const { employeeid } = req.params;
  const query = 'SELECT fullname, subject, qualification, experience, dateofbirth, mobileNo, presentAddress, email FROM TeacherDetails WHERE employeeid = ?';

  db.query(query, [employeeid], (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    res.json(results[0]);
  });
});

// Update Teacher Data
app.put('/teacherModify/:employeeid', (req, res) => {
  const { employeeid } = req.params;
  const { fullname, subject, qualification, experience, dateofbirth, mobileNo, presentAddress, email } = req.body;

  const query = `
    UPDATE TeacherDetails
    SET fullname = ?, subject = ?, qualification = ?, experience = ?, dateofbirth = ?, mobileNo = ?, presentAddress = ?, email = ?
    WHERE employeeid = ?
  `;

  db.query(query, [fullname, subject, qualification, experience, dateofbirth, mobileNo, presentAddress, email, employeeid], (err, results) => {
    if (err) {
      console.error('Error updating data:', err);
      return res.status(500).json({ error: 'Failed to update data' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    res.json({ success: true });
  });
});

// GET /teacherDetails/:employeeId
app.get('/teacherInfo/:employeeid', (req, res) => {
  const { employeeid } = req.params;
  const sql = 'SELECT * FROM TeacherDetails WHERE employeeid = ?';
  db.query(sql, [employeeid], (err, result) => {
      if (err) {
          res.status(500).send(err);
      } else if (result.length > 0) {
          res.json(result[0]);
      } else {
          res.status(404).json({ message: 'Teacher not found' });
      }
  });
});

// POST /addClass
app.post('/addClass', (req, res) => {
  const { className, section, employeeid } = req.body;
  const checkClassSql = 'SELECT * FROM ClassDetails WHERE className = ? AND section = ?';
  db.query(checkClassSql, [className, section], (err, result) => {
      if (err) {
          return res.status(500).send(err);
      }
      if (result.length > 0) {
          return res.status(400).json({ message: 'Class with this name and section already exists' });
      }
      const addClassSql = 'INSERT INTO ClassDetails (className, section, employeeid) VALUES (?, ?, ?)';
      db.query(addClassSql, [className, section, employeeid], (err) => {
          if (err) {
              return res.status(500).send(err);
          }
          res.json({ success: true });
      });
  });
});

// POST /modifyClass
app.post('/modifyClass', (req, res) => {
  const { className, section, newEmployeeid } = req.body;
  console.log('Modifying class with:', { className, section, newEmployeeid }); // Debugging line

  const sql = 'UPDATE ClassDetails SET employeeid = ? WHERE className = ? AND section = ?';
  db.query(sql, [newEmployeeid, className, section], (err, result) => {
    if (err) {
      console.error('Error updating class:', err);
      return res.status(500).send(err);
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json({ success: true });
  });
});


// Add Timetable Entry with new columns
app.post('/timetable', async (req, res) => {
  const { timetableEntries } = req.body;
  
  try {
    const promises = timetableEntries.map(entry => {
      return db.query(
        'INSERT INTO TimeTable (className, section, day, periodPart, startTime, endTime, subject, employeeid, teacherName, link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [entry.className, entry.section, entry.day, entry.periodPart, entry.startTime, entry.endTime, entry.subject, entry.employeeid, entry.teacherName, entry.link]
      );
    });

    await Promise.all(promises);
    res.json({ message: 'Timetable entries added successfully' });
  } catch (error) {
    console.error('Error adding timetable entries:', error);
    res.status(500).json({ error: 'Unable to add timetable entries' });
  }
});

// Check for Duplicates
app.post('/checkDuplicates', async (req, res) => {
  const { className, section, day, periodPart, startTime, endTime } = req.body;

  try {
    const query = `
      SELECT COUNT(*) AS count
      FROM TimeTable
      WHERE className = ? AND section = ? AND day = ? AND periodPart = ? AND startTime = ? AND endTime = ?
    `;

    const [rows] = await pool.query(query, [
      className, 
      section, 
      day, 
      periodPart, 
      startTime, 
      endTime
    ]);

    if (rows[0].count > 0) {
      res.json({ duplicate: true });
    } else {
      res.json({ duplicate: false });
    }
  } catch (error) {
    console.error('Error checking duplicates:', error);
    res.status(500).json({ error: 'Unable to check for duplicates' });
  }
});


// Endpoint to get class details
app.get('/classDetails', (req, res) => {
  const query = `
    SELECT className, GROUP_CONCAT(DISTINCT section ORDER BY section ASC) AS sections
    FROM ClassDetails
    GROUP BY className
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    // Transform results into a more usable format
    const transformedResults = results.map(row => ({
      className: row.className,
      sections: row.sections.split(',')
    }));

    res.json(transformedResults);
  });
});

// GET /classTeacher
app.get('/classTeacher', (req, res) => {
  const { employeeid } = req.query;

  const sql = 'SELECT className, section FROM ClassDetails WHERE employeeid = ?';
  db.query(sql, [employeeid], (err, result) => {
    if (err) {
      console.error('Error fetching class details:', err);
      res.status(500).json({ message: 'Server error' });
    } else if (result.length > 0) {
      res.json(result);
    } else {
      res.status(404).json({ message: 'Class details not found' });
    }
  });
});


// GET /studentTeacherComplaint
app.get('/studentTeacherComplaint', (req, res) => {
  const { className, section, recipient } = req.query;

  const sql = 'SELECT * FROM StudentComplaint WHERE className = ? AND section = ? AND recipient = ?';
  db.query(sql, [className, section, recipient], (err, result) => {
    if (err) {
      console.error('Error fetching student complaints:', err);
      res.status(500).json({ message: 'Server error' });
    } else if (result.length > 0) {
      res.json(result);
    } else {
      res.status(404).json({ message: 'No complaints found' });
    }
  });
});

// Api for getting notification complaints from Students
// Endpoint to get student complaints
// Get notifications for a teacher
app.get('/studentNotificationComplaints', async (req, res) => {
  const { className, section } = req.query;
  
  try {
    const query = `
      SELECT * FROM StudentComplaint 
      WHERE className = ? 
      AND section = ? 
      AND recipient = 'teacher' 
      AND is_resolved = 0
    `;
    const [rows] = await db.execute(query, [className, section]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching student notifications:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/teacherAttendance', (req, res) => {
  const attendanceData = req.body;

  if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
    return res.status(400).json({ message: "Invalid data" });
  }

  const values = attendanceData.map(({ employeeid, date, status }) => [employeeid, date, status]);
  const sql = 'INSERT INTO TeacherAttendance (employeeid, date, status) VALUES ?';

  db.query(sql, [values], (err, results) => {
    if (err) {
      console.error("Error inserting teacher attendance:", err);
      return res.status(500).json({ message: "Server error" });
    }
    res.status(200).json({ message: "Attendance submitted successfully" });
  });
});

app.get('/teacherAttendance', (req, res) => {
  const { employeeid } = req.query;
  const sql = 'SELECT status, COUNT(*) as count FROM TeacherAttendance WHERE employeeid = ? GROUP BY status';
  db.query(sql, [employeeid], (err, data) => {
    if (err) {
      console.error("Error querying database:", err);
      return res.json({ Error: "Attendance fetch error" });
    }
    const attendanceSummary = data.reduce((acc, curr) => {
      acc[curr.status.toLowerCase()] = curr.count;
      return acc;
    }, { present: 0, absent: 0, leave: 0, holiday: 0 });
    return res.json(attendanceSummary);
  });
});



app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
