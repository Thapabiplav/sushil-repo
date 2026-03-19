"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImageFromBuffer = uploadImageFromBuffer;
const cloudinary_1 = require("../config/cloudinary");
async function uploadImageFromBuffer(buffer, mimetype, folder = 'sushil-school', resourceType = 'image') {
    const base64 = buffer.toString('base64');
    const dataUri = `data:${mimetype};base64,${base64}`;
    return cloudinary_1.cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: resourceType,
    });
}
//# sourceMappingURL=cloudinary.service.js.map