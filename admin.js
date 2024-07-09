
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