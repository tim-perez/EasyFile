import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function CreateOrder() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        setStatusMessage({ type: '', text: '' });
        let newOrderId = null;

        try {
            // Step 1: Create the Order (Critical Path)
            const orderResponse = await api.post('/orders/create', {
                category: data.category,
                summary: data.summary
            });
            newOrderId = orderResponse.data.orderId;
        } catch (error) {
            console.error("Order creation failed:", error);
            setStatusMessage({ type: 'error', text: "Failed to create order. Please try again." });
            setIsSubmitting(false);
            return; // Halt execution
        }

        // Step 2: Upload Files (Frontend Recovery Path)
        if (data.documents && data.documents.length > 0) {
            try {
                for (let i = 0; i < data.documents.length; i++) {
                    const formData = new FormData();
                    formData.append('file', data.documents[i]);
                    
                    await api.post(`/documents/upload/${newOrderId}`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                }
                navigate('/dashboard'); // Success, go to dashboard
            } catch (error) {
                console.error("File upload failed:", error);
                setStatusMessage({ 
                    type: 'warning', 
                    text: `Order #${newOrderId} was created, but files failed to upload. You can retry uploading from your dashboard.` 
                });
                setIsSubmitting(false);
            }
        } else {
            navigate('/dashboard'); // No files to upload, go to dashboard
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-md">
            <h2 className="text-2xl font-bold mb-6">Place an Order</h2>
            
            {statusMessage.text && (
                <div className={`p-4 mb-4 rounded ${statusMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'}`}>
                    {statusMessage.text}
                </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select 
                        {...register("category", { required: "Category is required" })}
                        className="w-full border p-2 rounded"
                    >
                        <option value="">Select a category...</option>
                        <option value="Tax Review">Tax Review</option>
                        <option value="Legal Consultation">Legal Consultation</option>
                        <option value="Financial Audit">Financial Audit</option>
                    </select>
                    {errors.category && <span className="text-red-500 text-sm">{errors.category.message}</span>}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Summary</label>
                    <textarea 
                        {...register("summary", { required: "Please provide a brief summary" })}
                        className="w-full border p-2 rounded h-32"
                        placeholder="Describe what you need reviewed..."
                    ></textarea>
                    {errors.summary && <span className="text-red-500 text-sm">{errors.summary.message}</span>}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Attach Documents</label>
                    <input 
                        type="file" 
                        multiple
                        {...register("documents")}
                        className="w-full border p-2 rounded"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {isSubmitting ? 'Processing...' : 'Submit Order'}
                </button>
            </form>
        </div>
    );
}