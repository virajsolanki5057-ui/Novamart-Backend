import User from "../models/User.js";

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: "user" }).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: "user" },
      req.body,
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.params.id, role: "user" });
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({ msg: "User deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }).select("-password");
    res.json(admins);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const getAdminById = async (req, res) => {
  try {
    const admin = await User.findOne({ _id: req.params.id, role: "admin" }).select("-password");
    if (!admin) return res.status(404).json({ msg: "Admin not found" });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const admin = await User.findOneAndUpdate(
      { _id: req.params.id, role: "admin" },
      req.body,
      { new: true }
    ).select("-password");
    if (!admin) return res.status(404).json({ msg: "Admin not found" });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ msg: "Cannot delete yourself" });
    }
    const admin = await User.findOneAndDelete({ _id: req.params.id, role: "admin" });
    if (!admin) return res.status(404).json({ msg: "Admin not found" });
    res.json({ msg: "Admin deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};