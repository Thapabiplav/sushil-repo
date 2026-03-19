import { Router } from 'express';
import { teacherDashboardHandler, teacherMaterialUploadHandler, teacherProfileImageHandler, teacherProfileImageUploadHandler, teacherProfileUpdateHandler, teacherMaterialDeleteHandler } from './teacher.controller';
import { upload } from '../../utils/upload';

export const teacherRouter = Router();

teacherRouter.get('/:teacherId/dashboard', teacherDashboardHandler);
teacherRouter.post('/:teacherId/materials', upload.single('file'), teacherMaterialUploadHandler);
teacherRouter.delete('/:teacherId/materials/:materialId', teacherMaterialDeleteHandler);
teacherRouter.put('/:teacherId/profile-image', teacherProfileImageHandler);
teacherRouter.post('/:teacherId/profile-image/upload', upload.single('image'), teacherProfileImageUploadHandler);
teacherRouter.put('/:teacherId/profile', teacherProfileUpdateHandler);

