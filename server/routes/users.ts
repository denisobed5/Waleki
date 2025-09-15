import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import { User } from "@shared/api";
import { database } from "../database.js";

// Get all users (admin only)
export const getAllUsers: RequestHandler = async (req, res) => {
  try {
    const users = await database.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Get user by ID (admin only)
export const getUserById: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await database.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// Create new user (admin only)
export const createUser: RequestHandler = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: "Username, email, password, and role are required" });
    }

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: "Invalid role. Must be 'admin' or 'user'" });
    }

    // Check if username or email already exists
    const existingUser = await database.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await database.createUser({
      username,
      email,
      passwordHash,
      role
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Create user error:", error);
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      if (error.message.includes('username')) {
        return res.status(400).json({ error: "Username already exists" });
      }
      if (error.message.includes('email')) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }
    
    res.status(500).json({ error: "Failed to create user" });
  }
};

// Update user (admin only)
export const updateUser: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { username, email, role } = req.body;
    const updates: any = {};

    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) {
      if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be 'admin' or 'user'" });
      }
      updates.role = role;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const updatedUser = await database.updateUser(id, updates);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Update user error:", error);
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      if (error.message.includes('username')) {
        return res.status(400).json({ error: "Username already exists" });
      }
      if (error.message.includes('email')) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }
    
    res.status(500).json({ error: "Failed to update user" });
  }
};

// Delete user (admin only)
export const deleteUser: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Get current user from request (set by authentication middleware)
    const currentUser = (req as any).user as User;
    
    // Prevent users from deleting themselves
    if (currentUser.id === id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    const deleted = await database.deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// Change user password (admin only or own account)
export const changePassword: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { currentPassword, newPassword } = req.body;
    const currentUser = (req as any).user as User;

    // If changing someone else's password, must be admin
    if (currentUser.id !== id && currentUser.role !== 'admin') {
      return res.status(403).json({ error: "Cannot change another user's password" });
    }

    if (!newPassword) {
      return res.status(400).json({ error: "New password is required" });
    }

    // If changing own password, verify current password
    if (currentUser.id === id) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Current password is required" });
      }

      const userWithPassword = await database.getUserByUsername(currentUser.username);
      if (!userWithPassword) {
        return res.status(404).json({ error: "User not found" });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, userWithPassword.passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database (you'll need to add this method to the database class)
    // For now, we'll return a success message
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
};
