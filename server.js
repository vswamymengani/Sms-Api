const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require("cors");
const bcrypt = require("bcrypt");
const session = require('express-session');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(session({
  secret: 'Akash$143', // Replace with your secret key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Akash$143',
  database: 'smsproject'
});

const saltRounds = 10; // Salt rounds for bcrypt hashing

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to MySQL database');
});

//Api for Teacher register
app.post("/teacherregister", (req, res) => {
  const { fullname, className, section, dateofbirth, email, mobileNo, employeeid, experience, presentaddress, password, confirmpassword } = req.body;

  if (!fullname || !className || !section || !dateofbirth || !email || !mobileNo || !employeeid || !experience || !presentaddress || !password || !confirmpassword) {
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

    const sql = `INSERT INTO TeacherDetails (fullname, className, section, dateofbirth, email, mobileNo, employeeid, experience, presentaddress, password, confirmpassword) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`;
    const values = [fullname, className, section, dateofbirth, email, mobileNo, employeeid, experience, presentaddress, hashedPassword, hashedPassword];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Error inserting user:", err);
        return res.status(500).json({ message: "Something unexpected has occurred: " + err });
      }
      return res.json({ success: "Teacher added successfully" });
    });
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
        bcrypt.compare(password.toString(), data[0].password, (err, response) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return res.status(500).json({ Error: "Error comparing passwords" });
          }
          if (response) {
            req.session.email = email; // Save email in session
            res.json({ Status: "Success" });
          } else {
            return res.status(400).json({ Error: "Password not matched" });
          }
        });
      } else {
        return res.status(400).json({ Error: "Email not exists" });
      }
    });
  });
  

  
app.post('/leave', (req, res) => {
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


  
//teacher homework api
app.post('/teacherHomework', (req,res) =>{

    const {classname,section,subject,typeOfHomework,title,duration,homework,email} =req.body;
  
    const sql= 'INSERT INTO TeacherHomework (classname,section,subject,typeOfHomework,title,duration,homework,email) VALUES (?,?,?,?,?,?,?,?)';
    const values = [classname,section,subject,typeOfHomework,title,duration,homework,email];
  
    db.query(sql,values,(err,result) =>{
      if(err){
        console.error("Error inserting in teacher homework screen" ,err);
        return res.status(500).json({message:"something unexpected has happed:"+ err});
      }
      res.json({success:"homework send successfully"});
    });
  });
  
  


  

//api for geting teacher leave details
app.get('/teacherLeaves',(req,res) =>{
  
    const sql = "SELECT * FROM TeacherLeave WHERE approval IS NULL";
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

  
  
app.get('/teacherprofile', (req, res) => {
    const email = req.query.email; // Assume email is passed as a query parameter
    const sql = 'SELECT * FROM TeacherDetails WHERE email = ?';
    db.query(sql, [email], (err, data) => {
      if (err) {
        console.error("Error querying database:", err);
        return res.json({ Error: "Profile fetch error" });
      }
      if (data.length > 0) {
        const userProfile = data[0];
        delete userProfile.password; // Remove sensitive data
        delete userProfile.confirmpassword;
        return res.json(userProfile);
      } else {
        return res.json({ Error: "Profile not found" });
      }
    });
  });
  
// New API for updating teacher details
app.post('/teacherupdate', (req, res) => {
    const { field, value, email } = req.body;
  
    if (!field || !value || !email) {
      return res.status(400).json({ message: "Invalid input" });
    }
  
    // Construct the SQL query to update the specified field
    const sql = `UPDATE TeacherDetails SET ${field} = ? WHERE email = ?`;
  
    // Execute the query with the provided values
    db.query(sql, [value, email], (err, result) => {
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
  

  //Api for teacher ComplainsScreen on admin screen
app.get('/teacherComplaints',(req,res) =>{
    const sql = 'SELECT * FROM TeacherComplaints WHERE is_resolved = FALSE';
  
    db.query(sql,(err,results) =>{
      if(err){
        console.error("Error feaching teacher complaints:", err);
        return res.status(500).json({message:"Server Error"});
      }
      res.json(results);
    });
  });



// Endpoint to add questions
app.post('/api/questions', (req, res) => {
  const { questions } = req.body;

  // Validate input
  if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).send('Invalid input data');
  }

  // Prepare SQL query and values
  const sql = 'INSERT INTO questions (question, options, correctAnswer) VALUES ?';
  const values = questions.map(q => [q.question, JSON.stringify(q.options), q.correctAnswer]);

  db.query(sql, [values], (err, result) => {
      if (err) {
          console.error('Database query failed:', err);
          return res.status(500).send('Failed to add questions');
      }
      res.status(201).send('Questions added successfully');
  });
});



///student online exam screen api
app.get('/api/questions', (req, res) => {
  const sql = 'SELECT * FROM questions'; // Adjust the query based on your schema

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Failed to fetch questions');
      return;
    }

    // Ensure the options are parsed as arrays
    const questions = results.map(row => ({
      id: row.id,
      question: row.question,
      options: JSON.parse(row.options), // Ensure options are parsed from JSON
      correctAnswer: row.correctAnswer
    }));

    res.json(questions);
  });
});
app.post('/api/submit', (req, res) => {
  const { answers } = req.body;

  // Validate answers format
  if (!answers || typeof answers !== 'object') {
    return res.status(400).send('Invalid answers format');
  }

  // Fetch correct answers from the database
  db.query('SELECT id, correctAnswer FROM questions', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Failed to get correct answers');
    }

    let score = 0;
    let totalQuestions = results.length;
    let incorrectAnswers = 0;

    // Create a map of correct answers for easy comparison
    const correctAnswersMap = results.reduce((acc, question) => {
      acc[question.id] = question.correctAnswer;
      return acc;
    }, {});

    // Compare submitted answers with correct answers
    for (const [questionId, answer] of Object.entries(answers)) {
      if (correctAnswersMap[questionId] === answer) {
        score++;
      } else {
        incorrectAnswers++;
      }
    }

    // Return the result with both correct and incorrect counts
    res.json({ score, totalQuestions, incorrectAnswers });
  });
});


// API endpoint to add a book
app.post('/addBook', (req, res) => {
  const { bookTitle, author, isbn, description, coverPhoto } = req.body;
  const query = 'INSERT INTO books (bookTitle, author, isbn, description, coverPhoto) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [bookTitle, author, isbn, description, coverPhoto], (err, result) => {
    if (err) {
      res.status(500).send('Server error');
    } else {
      res.status(200).send('Book added successfully');
    }
  });
});


// API endpoint to get all books
app.get('/getBooks', (req, res) => {
  const query = 'SELECT * FROM books';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send('Server error');
    } else {
      res.status(200).json(results);
    }
  });
});
  

// Endpoint to resolve Teacher  complaint
app.put('/teacherComplaints/:id/resolve', (req, res) => {
    const complaintId = req.params.id;
  
    const sql = 'UPDATE TeacherComplaints SET is_resolved = TRUE WHERE id = ?';
    db.query(sql, [complaintId], (err, result) => {
      if (err) {
        console.error("Error resolving complaint:", err);
        return res.status(500).json({ message: "Server error" });
      }
      res.json({ success: "Complaint resolved successfully" });
    });
  });
  
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
      bcrypt.compare(password.toString(), data[0].password, (err, response) => {
        if (err) {
          console.error("Error comparing passwords:", err);
          return res.status(500).json({ message: "Server error" });
        }
        if (response) {
          req.session.email = email;
          res.json({ status: "Success" });
        } else {
          res.status(400).json({ message: "Password not matched" });
        }
      });
    } else {
      res.status(400).json({ message: "Email not exists" });
    }
  });
});

//Update Student Details
app.post('/updateProfile', (req, res) => {
  const { email, field, value } = req.body;
  
  let sql = `UPDATE StudentDetails SET ${field} = ? WHERE email = ?`;
  let data = [value, email];

  db.query(sql, data, (err, result) => {
    if (err) {
      res.status(500).json({ success: false, message: 'Failed to update profile information' });
    } else {
      res.json({ success: true, message: 'Profile information updated successfully' });
    }
  });
});

//Api for notifications about homework
app.get('/studentHomework',(req,res) =>{
  const sql = 'Select * FROM TeacherHomework';

  db.query(sql,(err,results) =>{
    if(err){
      console.error("error while feaching the homework",err);
      return res.status(500).json({message:"server Error"});
    }
    res.json(results);
  });
});


//fee details fetch api
app.get('/feedetails',(req,res) =>{
  const email = req.query.email;

  const sql = "SELECT * FROM FeeDetails WHERE email =?";

  db.query(sql,[email],(err,data) =>{
    if(err){
      console.error("Error querying database:", err);
      return res.json({ Error: "fee deatils fetch error" });
    }
    if(data.length > 0){
      const userFee= data[0];
      return res.json(userFee);
    }else{
      return res.json({Error:"fee details not found"});
    }
  });
});



// GET request to fetch student details
app.get('/students', (req, res) => {
  const sql = 'SELECT * FROM StudentDetails';

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching student details:", err);
      return res.status(500).json({ message: "Something unexpected has occurred: " + err });
    }
    res.json(results);
  });
});

// Logout endpoint to destroy the session
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout error" });
    }
    res.json({ message: "Logout successful" });
  });
});

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

//api for student leaves showing
app.get('/studentLeaves', (req,res) =>{
  
  const sql = "SELECT * FROM StudentLeave  WHERE approval IS NULL";

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


// Api for profile details
app.get('/profile', (req, res) => {
  const email = req.query.email; // Assume email is passed as a query parameter
  const sql = 'SELECT * FROM StudentDetails WHERE email = ?';
  db.query(sql, [email], (err, data) => {
    if (err) {
      console.error("Error querying database:", err);
      return res.json({ Error: "Profile fetch error" });
    }
    if (data.length > 0) {
      const userProfile = data[0];
      delete userProfile.password; // Remove sensitive data
      delete userProfile.confirmpassword;
      return res.json(userProfile);
    } else {
      return res.json({ Error: "Profile not found" });
    }
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


// API for submitting attendance
app.post('/attendance', (req, res) => {
  const attendanceData = req.body;

  if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
    return res.status(400).json({ message: "Invalid attendance data" });
  }

  const values = attendanceData.map(({ rollno, date, subject, status, className, section }) => [rollno, date, subject, status, className, section]);

  const sql = 'INSERT INTO Attendance (rollno, date, subject, status, className, section) VALUES ?';

  db.query(sql, [values], (err, result) => {
    if (err) {
      console.error("Error inserting attendance:", err);
      return res.status(500).json({ message: "Something unexpected has occurred: " + err });
    }
    res.json({ success: "Attendance submitted successfully" });
  });
});







// API for retrieving attendance summary
app.get('/attendance/summary', (req, res) => {
  const { rollno, startDate, endDate, className, section } = req.query;

  const conditions = [];
  const values = [];

  if (rollno) {
    conditions.push("rollno = ?");
    values.push(rollno);
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





// Api for getting complaints from Students
app.get('/complaints', (req, res) => {
  const recipient = req.query.recipient;

  if (!recipient) {
    return res.status(400).json({ message: "Recipient not specified" });
  }

  const sql = 'SELECT * FROM StudentComplaint WHERE recipient = ? AND is_resolved = FALSE';
  
  db.query(sql, [recipient], (err, results) => {
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

  const sql = 'UPDATE StudentComplaint SET is_resolved = TRUE WHERE id = ?';
  db.query(sql, [complaintId], (err, result) => {
    if (err) {
      console.error("Error resolving complaint:", err);
      return res.status(500).json({ message: "Server error" });
    }
    res.json({ success: "Complaint resolved successfully" });
  });
});

//api for see  announcements from admin
app.get('/reciveAnnouncements' ,(req,res) =>{
  const sql = 'SELECT * FROM Announcement WHERE reciver = "Teacher" ';

  db.query(sql,(err,results) =>{
    if(err){
      console.error("error while feaching the annpouncements",err);
      return res.status(500).json({ message:"Server error"});
    }
    res.json(results);
  });
});



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

// API Endpoint to save timetable entries
app.post('/timetable', (req, res) => {
  const { timetableEntries } = req.body;

  if (!timetableEntries || timetableEntries.length === 0) {
    return res.status(400).json({ error: 'No timetable entries provided' });
  }

  const sql = 'INSERT INTO TimeTable (className, section, day, period, subject, employeeId) VALUES ?';
  const values = timetableEntries.map((entry) => [
    entry.className,
    entry.section,
    entry.day,
    entry.period,
    entry.subject,
    entry.employeeId,
  ]);

  // Execute the INSERT query
  db.query(sql, [values], (err, result) => {
    if (err) {
      console.error('Error saving timetable entries:', err);
      return res.status(500).json({ error: 'Failed to save timetable entries' });
    }
    console.log('Timetable entries saved successfully');
    res.status(200).json({ message: 'Timetable entries saved successfully' });
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



// API endpoint to fetch homework data
app.get('/homework/:classname/:section', (req, res) => {
  const { classname, section } = req.params;
  const query = `
    SELECT id, subject, typeOfHomework, title, duration, homework
    FROM TeacherHomeWork
    WHERE classname = ? AND section = ?
  `;
  
  db.query(query, [classname, section], (err, results) => {
    if (err) {
      console.error('Error fetching homework data:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    
    res.json(results);
  });
});

//api for fetching student leaves 
app.get('/leaves', (req, res) => {
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

app.post('/results', (req, res) => {
  const marksData = req.body; // Assuming marksData is an array of objects

  if (!marksData || !Array.isArray(marksData)) {
      return res.status(400).json({ message: "Invalid marks data provided" });
  }

  // Assuming marksData is an array of objects with keys matching column names
  const sql = "INSERT INTO ExamResults (className, section, examType, subject, rollno, fullname, marks, email) VALUES ?";
  const values = marksData.map(data => [data.className, data.section, data.examType, data.subject, data.rollno, data.fullname, data.marks, data.email]);

  db.query(sql, [values], (err, results) => {
      if (err) {
          console.error("Error inserting marks:", err);
          return res.status(500).json({ message: "Failed to insert marks into database" });
      }
      console.log("Marks inserted successfully");
      res.status(200).json({ message: "Marks inserted successfully" });
  });
});




app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});