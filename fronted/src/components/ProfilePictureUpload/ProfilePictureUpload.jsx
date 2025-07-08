import React, { useState, useRef } from 'react';
import { Camera, Upload } from 'lucide-react';
import authService from '../services/authService';
import { toast } from 'react-toastify';

const ProfilePictureUpload = ({ userId, currentPicture, onUploadSuccess }) => {
    const fileInputRef = useRef();
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(currentPicture || null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validaciones
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            toast.error('Solo se permiten imágenes JPEG, PNG o GIF');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('El tamaño máximo es 5MB');
            return;
        }

        // Vista previa
        const reader = new FileReader();
        reader.onload = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(file);

        // Subir archivo
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = authService.getCurrentUser()?.token;
            const response = await fetch(
                `http://localhost:5023/api/users/${userId}/profile-picture`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al subir la foto');
            }

            const result = await response.json();
            onUploadSuccess(result.profilePictureUrl);
            toast.success('Foto de perfil actualizada');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.message);
            setPreviewUrl(currentPicture); // Revertir a la imagen anterior
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200">
                {previewUrl ? (
                    <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <User className="text-gray-400" size={48} />
                    </div>
                )}
            </div>
            
            <button
                onClick={() => fileInputRef.current.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition"
            >
                {isUploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                ) : (
                    <Camera className="text-blue-600" size={20} />
                )}
            </button>
            
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg, image/png, image/gif"
                className="hidden"
            />
        </div>
    );
};

export default ProfilePictureUpload;