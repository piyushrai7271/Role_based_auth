const data = (req, res) => {
  const { email,password } = req.body;

  const user = {
    email,
    password
  };

  return res.json({
    success: true,
    Message: "Data send successfully !!",
    user,
  });
};

export { data };
