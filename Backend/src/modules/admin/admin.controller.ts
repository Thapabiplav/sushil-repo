import type { Request, Response, NextFunction } from "express";
import {
  getAdminDashboardData,
  getReportsData,
  createNotice,
  updateNotice,
  deleteNotice,
  createEvent,
  updateEvent,
  deleteEvent,
  createUser,
  listUsers,
  updateUser,
  deleteUser,
  listClassesWithSections,
  createOrUpdateClassWithSections,
  deleteClassWithSections,
  listSubjects,
  createSubject,
  bulkCreateSubjects,
  updateSubject,
  deleteSubject,
  listRoles,
  createRole,
  deleteRole,
  listRoleAssignments,
  updateRoleAssignments,
  isTeacherIdAvailable,
  getSchoolProfile,
  updateSchoolProfile,
  bulkImportStudents,
  getStudentImportTemplate,
  BulkStudentData,
  // Teacher assignment functions
  getTeacherSubjectAssignments,
  getTeacherClassTeacherAssignments,
  assignTeacherSubjects,
  assignClassTeacher,
  deleteClassTeacherAssignments,
  getTeacherAssignmentsSummary,
} from "./admin.service";
import { uploadImageFromBuffer } from "../../services/cloudinary.service";
import { upload } from "../../utils/upload";
import { z } from "zod";

const noticeSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  date: z.string(),
  type: z.string(),
  imageUrl: z.string().optional().nullable(),
});

const eventSchema = z.object({
  title: z.string().min(1),
  date: z.string(),
  time: z.string(),
  venue: z.string(),
});

export async function adminDashboardHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getAdminDashboardData();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

// Shared dashboard summary handler - returns role-based data
export async function dashboardSummaryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = (req as any).user;
    const role = user?.role;

    if (!role || !["admin", "teacher", "student"].includes(role)) {
      throw new HttpError(403, "Unauthorized access");
    }

    const summary = await getDashboardSummary(role);
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

export async function reportsHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getReportsData();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function createNoticeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const body = noticeSchema.parse(req.body);
    const notice = await createNotice(body);
    res.status(201).json(notice);
  } catch (error) {
    next(error);
  }
}

export async function updateNoticeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid notice ID" });
    }
    const body = noticeSchema.partial().parse(req.body);
    const notice = await updateNotice(id, body);
    res.json(notice);
  } catch (error) {
    next(error);
  }
}

export async function deleteNoticeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid notice ID" });
    }
    await deleteNotice(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function createEventHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const body = eventSchema.parse(req.body);
    const event = await createEvent(body);
    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
}

export async function updateEventHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }
    const body = eventSchema.partial().parse(req.body);
    const event = await updateEvent(id, body);
    res.json(event);
  } catch (error) {
    next(error);
  }
}

export async function deleteEventHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }
    await deleteEvent(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;

// Accepts:
// - +97798XXXXXXXX or +97797XXXXXXXX or +97796XXXXXXXX
// - 98XXXXXXXX, 97XXXXXXXX, 96XXXXXXXX (10 digits)
const nepalPhoneRegex = /^(\+977(?:98|97|96)\d{8}|(?:98|97|96)\d{8})$/;

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z
    .string()
    .regex(
      strongPasswordRegex,
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
    ),
  role: z.enum(["teacher", "student"]),
  roleId: z.number().optional(),
  phone: z
    .string()
    .regex(nepalPhoneRegex, "Invalid Nepal phone number")
    .optional(),
  address: z.string().optional(),
  class: z.string().optional(),
  section: z.string().optional(),
  rollNumber: z.string().optional(),
  teacherId: z.string().optional(),
  assignedClasses: z.array(z.string()).optional(),
});

export async function listUsersHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const role = req.query.role as string | undefined;
    const users = await listUsers(role);
    res.json(users);
  } catch (error) {
    next(error);
  }
}

export async function createUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const body = createUserSchema.parse(req.body);
    const user = await createUser(body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

export async function updateUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const partialSchema = createUserSchema
      .partial()
      .omit({ password: true, role: true });
    const body = partialSchema.parse(req.body);
    const user = await updateUser(id, body);
    res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function deleteUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    await deleteUser(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function listClassesHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await listClassesWithSections();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function createOrUpdateClassHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const idParam = req.params.id;
    const id = idParam ? Number(idParam) : undefined;
    if (idParam && isNaN(Number(idParam))) {
      return res.status(400).json({ message: "Invalid class ID" });
    }

    const body = z
      .object({
        name: z.string().min(1),
        isActive: z.boolean().optional(),
        sections: z
          .array(
            z.object({ id: z.number().optional(), name: z.string().min(1) }),
          )
          .optional(),
      })
      .parse(req.body);

    const result = await createOrUpdateClassWithSections(id, body);
    res.status(id ? 200 : 201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteClassHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid class ID" });
    }
    await deleteClassWithSections(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function listSubjectsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const classId = req.query.classId ? Number(req.query.classId) : undefined;
    const data = await listSubjects(classId);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function createSubjectHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // Check if it's a bulk create request
    if (req.body.names && Array.isArray(req.body.names)) {
      const body = z
        .object({
          names: z.array(z.string().min(1)),
          classId: z.number().int().positive(),
        })
        .parse(req.body);

      const result = await bulkCreateSubjects(body);
      return res.status(201).json(result);
    }

    const body = z
      .object({
        name: z.string().min(1),
        classId: z.number().int().positive(),
        isActive: z.boolean().optional(),
      })
      .parse(req.body);
    const subject = await createSubject(body);
    res.status(201).json(subject);
  } catch (error) {
    next(error);
  }
}

export async function updateSubjectHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid subject ID" });
    }
    const body = z
      .object({
        name: z.string().min(1).optional(),
        classId: z.number().int().positive().optional(),
        isActive: z.boolean().optional(),
      })
      .parse(req.body);
    const subject = await updateSubject(id, body);
    res.json(subject);
  } catch (error) {
    next(error);
  }
}

export async function deleteSubjectHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid subject ID" });
    }
    await deleteSubject(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function listRolesHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const roles = await listRoles();
    res.json(roles);
  } catch (error) {
    next(error);
  }
}

export async function createRoleHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const body = z.object({ name: z.string().min(1) }).parse(req.body);
    const role = await createRole(body);
    res.status(201).json(role);
  } catch (error) {
    next(error);
  }
}

export async function deleteRoleHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid role ID" });
    }
    await deleteRole(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function listRoleAssignmentsHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await listRoleAssignments();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function updateRoleAssignmentsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const body = z
      .object({
        assignments: z.array(
          z.object({
            userId: z.number(),
            roleIds: z.array(z.number()),
          }),
        ),
      })
      .parse(req.body);
    await updateRoleAssignments(body.assignments);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function teacherIdAvailabilityHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const teacherId = String(req.query.teacherId ?? "").trim();
    if (!teacherId) {
      return res.status(400).json({ message: "teacherId is required" });
    }
    const result = await isTeacherIdAvailable(teacherId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getSchoolProfileHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const profile = await getSchoolProfile();
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

export async function updateSchoolProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const profile = await updateSchoolProfile(req.body);
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

// Bulk import students handler
const bulkImportSchema = z.object({
  class: z.string().min(1, "Class is required"),
  section: z.string().optional().default(""),
  students: z
    .array(
      z.object({
        name: z.string().min(1, "Name is required"),
        rollNumber: z.string().min(1, "Roll number is required"),
        email: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        guardian: z.string().optional(),
        password: z.string().optional(),
        section: z.string().optional(),
      }),
    )
    .min(1, "At least one student is required"),
});

export async function bulkImportStudentsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const body = bulkImportSchema.parse(req.body);
    const result = await bulkImportStudents(
      body.class,
      body.section,
      body.students as BulkStudentData[],
    );
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    next(error);
  }
}

// Get student import template handler
export async function getStudentImportTemplateHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const template = getStudentImportTemplate();
    res.json(template);
  } catch (error) {
    next(error);
  }
}

// Upload login background image handler
export const uploadLoginBackgroundHandler = [
  upload.single("image"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const result = await uploadImageFromBuffer(
        req.file.buffer,
        req.file.mimetype,
        "sushil-school/login-background",
      );

      res.json({
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (error) {
      next(error);
    }
  },
];

// General file upload handler (supports images, PDFs, documents)
export const uploadFileHandler = [
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const folder = req.body.folder || "sushil-school/uploads";
      const resourceType = req.file.mimetype.startsWith("image/")
        ? "image"
        : "raw";

      const result = await uploadImageFromBuffer(
        req.file.buffer,
        req.file.mimetype,
        folder,
        resourceType as "image" | "raw",
      );

      res.json({
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });
    } catch (error) {
      next(error);
    }
  },
];

// ==================== TEACHER ASSIGNMENT HANDLERS ====================

/**
 * Get teacher subject assignments
 */
export async function getTeacherSubjectAssignmentsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const teacherId = Number(req.params.teacherId);
    if (isNaN(teacherId)) {
      return res.status(400).json({ message: "Invalid teacher ID" });
    }
    const assignments = await getTeacherSubjectAssignments(teacherId);
    res.json(assignments);
  } catch (error) {
    next(error);
  }
}

/**
 * Get teacher class teacher assignments
 */
export async function getTeacherClassTeacherAssignmentsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const teacherId = Number(req.params.teacherId);
    if (isNaN(teacherId)) {
      return res.status(400).json({ message: "Invalid teacher ID" });
    }
    const assignments = await getTeacherClassTeacherAssignments(teacherId);
    res.json(assignments);
  } catch (error) {
    next(error);
  }
}

/**
 * Assign subjects to a teacher
 */
export async function assignTeacherSubjectsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const teacherId = Number(req.params.teacherId);
    if (isNaN(teacherId)) {
      return res.status(400).json({ message: "Invalid teacher ID" });
    }

    const body = z
      .object({
        assignments: z.array(
          z.object({
            subjectId: z.number().int().positive(),
            classId: z.number().int().positive(),
            sectionId: z.number().int().positive().nullable().optional(),
          }),
        ),
      })
      .parse(req.body);

    await assignTeacherSubjects(teacherId, body.assignments);
    res.json({ success: true, message: "Subjects assigned successfully" });
  } catch (error) {
    next(error);
  }
}

/**
 * Assign teacher as class teacher
 */
export async function assignClassTeacherHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const teacherId = Number(req.params.teacherId);
    if (isNaN(teacherId)) {
      return res.status(400).json({ message: "Invalid teacher ID" });
    }

    const body = z
      .object({
        assignments: z.array(
          z.object({
            classId: z.number().int().positive(),
            sectionId: z.number().int().positive().nullable().optional(),
            academicYear: z.string().min(1),
          }),
        ),
      })
      .parse(req.body);

    await assignClassTeacher(teacherId, body.assignments);
    res.json({ success: true, message: "Class teacher assigned successfully" });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete class teacher assignments for a teacher
 */
export async function deleteClassTeacherAssignmentsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const teacherId = Number(req.params.teacherId);
    if (isNaN(teacherId)) {
      return res.status(400).json({ message: "Invalid teacher ID" });
    }

    await deleteClassTeacherAssignments(teacherId);
    res.json({
      success: true,
      message: "Class teacher assignments deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get teacher assignments summary (for teacher profile)
 */
export async function getTeacherAssignmentsSummaryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const teacherId = Number(req.params.teacherId);
    if (isNaN(teacherId)) {
      return res.status(400).json({ message: "Invalid teacher ID" });
    }
    const summary = await getTeacherAssignmentsSummary(teacherId);
    res.json(summary);
  } catch (error) {
    next(error);
  }
}
