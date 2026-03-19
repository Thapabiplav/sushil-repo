import { Router } from 'express';
import {
  studentOverviewHandler,
  studentAttendanceHandler,
  studentAcademicsHandler,
  studentMaterialsHandler,
  studentAttendanceSubmitHandler,
  studentProfileImageHandler,
  studentProfileImageUploadHandler,
  studentProfileUpdateHandler,
} from './student.controller';
import { upload } from '../../utils/upload';

export const studentRouter = Router();

studentRouter.get('/:studentId/overview', studentOverviewHandler);
studentRouter.get('/:studentId/attendance', studentAttendanceHandler);
studentRouter.post(
  '/:studentId/attendance',
  upload.single('photo'),
  studentAttendanceSubmitHandler
);
studentRouter.get('/:studentId/academics', studentAcademicsHandler);
studentRouter.get('/:studentId/materials', studentMaterialsHandler);
studentRouter.put('/:studentId/profile-image', studentProfileImageHandler);
studentRouter.post('/:studentId/profile-image/upload', upload.single('image'), studentProfileImageUploadHandler);
studentRouter.put('/:studentId/profile', studentProfileUpdateHandler);

