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


  
//api for getting teacher homwwork list
app.get('/teacherHomeworkList',(req,res) =>{
    const email = req.query.email;
  
    const sql = "SELECT * FROM TeacherHomeWork WHERE email =?";
    db.query(sql,[email],(err,results)=>{
      if(err){
        console.error("error while fetching teacher Homework",err);
      }
      res.json(results);
    });
  });
  
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
  
    