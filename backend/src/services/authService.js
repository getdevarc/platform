const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userRepository = require("../repositories/userRepository");

exports.register = async ({ name, email, password }) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userRepository.createUser({
    name,
    email,
    password: hashedPassword,
  });

  return user;
};

exports.login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    throw new Error("User not found");
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return token;
};