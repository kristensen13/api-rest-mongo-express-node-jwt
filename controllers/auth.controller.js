import { User } from "../models/User.js";
import { generateToken, generateRefreshToken } from "../utils/tokenManager.js";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;
  try {
    // Alternativa buscando por email
    let user = await User.findOne({ email });
    if (user) throw { code: 1100 };

    user = new User({ email, password });
    await user.save();

    // Generar token JWT
    return res.status(201).json({ ok: true });
  } catch (error) {
    console.log(error);
    // Alternativa por defecto mongoose
    if (error.code === 1100) {
      return res.status(400).json({ error: "Ya existe este usuario" });
    }
    return res.status(500).json({ error: "Error de servidor" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user)
      return res.status(403).json({ error: "Este usuario no está registrado" });

    const respuestaPassword = await user.comparePassword(password);
    if (!respuestaPassword)
      return res.status(403).json({ error: "Contraseña incorrecta" });

    // Generar el token JWT
    const { token, expiresIn } = generateToken(user.id);

    generateRefreshToken(user.id, res);

    return res.json({ token, expiresIn });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error de servidor" });
  }
};

export const infoUser = async (req, res) => {
  try {
    const user = await User.findById(req.uid).lean();
    return res.json({ email: user.email, uid: user.id });
  } catch (error) {
    return res.status(500).json({ error: "Error de server" });
  }
};

export const refreshToken = (req, res) => {
  try {
    const refreshTokenCookie = req.cookies.refreshToken;
    if (!refreshTokenCookie) throw new Error("No existe el token");
    const { uid } = jwt.verify(refreshTokenCookie, process.env.JWT_REFRESH);

    const { token, expiresIn } = generateToken(uid);
    return res.json({ token, expiresIn });
  } catch (error) {
    console.log(error);
    const TokenVerificationErrors = {
      "invalid signature": "La firma del JWT token no es válida",
      "jwt expired": "JWT expirado",
      "invalid token": "Token no válido",
      "No Bearer": "Usa formato Bearer",
      "jwt malformed": "JWT formato no válido",
    };
    return res
      .status(401)
      .send({ error: TokenVerificationErrors[error.message] });
  }
};

export const logout = (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ ok: true });
};
