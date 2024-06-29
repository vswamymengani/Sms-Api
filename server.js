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
  secret: 'Akash$1143', // Replace with your secret key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Akash$143',
  database: 'SchoolManagement'
});

const saltRounds = 10; // Salt rounds for bcrypt hashing

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to MySQL database');
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

   ' const sql = INSERT INTO TeacherDetails (fullname, className, section, dateofbirth, email, mobileNo, employeeid, experience, presentaddress, password, confirmpassword) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)';
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





//Admin login code 
app.post('/leave', (req, res) => {
  const { employeeid, purpose, startdate, enddate, description } = req.body;

  const sql = 'INSERT INTO TeacherLeave (employeeid, purpose, startdate, enddate, description) VALUES (?, ?, ?, ?, ?)';
  const values = [employeeid, purpose, startdate, enddate, description];

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

  const {classname,section,subject,typeofHomework,title,duration,homework} =req.body;

  const sql= 'INSERT INTO TeacherHomework (classname,section,subject,typeofHomework,title,duration,homework) VALUES (?,?,?,?,?,?,?)';
  const values = [classname,section,subject,typeofHomework,title,duration,homework];

  db.query(sql,values,(err,result) =>{
    if(err){
      console.error("Error inserting in teacher homework screen" ,err);
      return res.status(500).json({message:"something unexpected has happed:"+ err});
    }
    res.json({success:"homework send successfully"});
  });
});

app.post('/studentLeave', (req, res) => {
  const { fullname, className, section, recipient, leavePurpose, startDate, endDate, description } = req.body;

  const sql = 'INSERT INTO StudentLeave (fullname, className, section, recipient, leavePurpose, startDate, endDate, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [fullname, className, section, recipient, leavePurpose, startDate, endDate, description];

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

app.post('/TeacherComplaints', (req, res) => {
  const { employeeid, typeOfComplaint, reason, explanation } = req.body;

  const sql = 'INSERT INTO TeacherComplaints (employeeid, typeOfComplaint, reason, explanation) VALUES  (?,?,?,?)';
  const values = [employeeid, typeOfComplaint, reason, explanation];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error inserting in teacher complaint", err);
      return res.status(500).json({ message: "Something unexpected has happend:" + err });
    }
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

app.get('/students', (req, res) => {
  const { className, section } = req.query;

  let sql = 'SELECT * FROM StudentDetails';
  const values = [];

  if (className && section) {
    sql += ' WHERE className = ? AND section = ?';
    values.push(className, section);
  } else if (className) {
    sql += ' WHERE className = ?';
    values.push(className);
  } else if (section) {
    sql += ' WHERE section = ?';
    values.push(section);
  }

  db.query(sql, values, (err, results) => {
    if (err) {
      console.error("Error fetching student details:", err);
      return res.status(500).json({ message: "Something unexpected has occurred: " + err });
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

// New API for updating teacher details
app.post('/teacherupdate', (req, res) => {
  const { field, value, email } = req.body;

  if (!field || !value || !email) {
    return res.status(400).json({ message: "Invalid input" });
  }

  // Construct the SQL query to update the specified field
  'const sql = UPDATE TeacherDetails SET ${field} = ? WHERE email = ?';

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

app.get('/studentdetails',(req,res) =>{
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



app.listen(port, () => {
  console.log('Server running on port ${port}');
});