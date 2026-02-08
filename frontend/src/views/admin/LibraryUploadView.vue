<template>
  <div class="upload-container">
    <div class="upload-header">
      <h1>📚 Upload Library Item</h1>
      <p>Add new books, documents, or publications</p>
    </div>

    <div class="upload-form">
      <form @submit.prevent="submitForm">
        <div class="form-group">
          <label for="title">Title *</label>
          <input
            id="title"
            v-model="formData.title"
            type="text"
            placeholder="Enter item title"
            required
          />
        </div>

        <div class="form-group">
          <label for="author">Author</label>
          <input
            id="author"
            v-model="formData.author"
            type="text"
            placeholder="Enter author name"
          />
        </div>

        <div class="form-group">
          <label for="category">Category *</label>
          <select id="category" v-model="formData.category" required>
            <option value="">Select category</option>
            <option value="book">Book</option>
            <option value="document">Document</option>
            <option value="publication">Publication</option>
            <option value="research_paper">Research Paper</option>
            <option value="guide">Guide</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea
            id="description"
            v-model="formData.description"
            placeholder="Enter item description"
            rows="4"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="file">File Upload *</label>
          <div class="file-upload" @click="$refs.fileInput?.click()">
            <input
              ref="fileInput"
              id="file"
              type="file"
              @change="onFileSelected"
              accept=".pdf,.doc,.docx,.xlsx,.pptx,.txt,.zip"
              required
            />
            <p style="margin: 0; color: #0066cc; font-weight: 500;">📁 Click to upload or drag and drop</p>
            <p class="file-help">Accepted formats: PDF, DOC, DOCX, XLSX, PPTX, TXT, ZIP</p>
            <p v-if="selectedFile" class="file-info">
              Selected: <strong>{{ selectedFile.name }}</strong> ({{ formatFileSize(selectedFile.size) }})
            </p>
          </div>
        </div>

        <div class="form-group">
          <label for="cover">Cover Image (Optional)</label>
          <div class="file-upload" @click="$refs.coverInput?.click()">
            <input
              ref="coverInput"
              id="cover"
              type="file"
              @change="onCoverSelected"
              accept="image/jpeg,image/png,image/webp"
            />
            <p style="margin: 0; color: #0066cc; font-weight: 500;">🖼️ Click to upload cover image</p>
            <p class="file-help">Accepted formats: JPEG, PNG, WebP</p>
            <p v-if="selectedCover" class="file-info">
              Selected: <strong>{{ selectedCover.name }}</strong> ({{ formatFileSize(selectedCover.size) }})
            </p>
            <div v-if="coverPreview" class="cover-preview">
              <img :src="coverPreview" alt="Cover preview" />
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="loading">⏳ Uploading...</span>
            <span v-else>⬆️ Upload Item</span>
          </button>
          <button type="button" class="btn btn-secondary" @click="resetForm">
            Reset
          </button>
        </div>
      </form>

      <div v-if="successMessage" class="message success">
        ✓ {{ successMessage }}
      </div>

      <div v-if="errorMessage" class="message error">
        ✗ {{ errorMessage }}
      </div>
    </div>

    <div class="uploaded-items">
      <h2>Recently Uploaded Items</h2>
      <table v-if="uploadedItems.length > 0" class="items-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Category</th>
            <th>File</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in uploadedItems" :key="item.id">
            <td>{{ item.title }}</td>
            <td>{{ item.author || '-' }}</td>
            <td>
              <span class="category-badge">{{ formatCategory(item.category) }}</span>
            </td>
            <td>{{ item.fileName }}</td>
            <td>
              <button @click="deleteItem(item.id)" class="btn btn-delete" title="Delete">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="no-items">
        <p>No items uploaded yet</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { libraryService } from '@/services/library';

const formData = ref({
  title: '',
  author: '',
  category: '',
  description: '',
});

const selectedFile = ref<File | null>(null);
const selectedCover = ref<File | null>(null);
const coverPreview = ref<string>('');
const loading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const uploadedItems = ref<any[]>([]);

const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0];
    console.log('File selected:', selectedFile.value.name, selectedFile.value.size);
  }
};

const onCoverSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedCover.value = target.files[0];
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      coverPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(target.files[0]);
  }
};

const submitForm = async () => {
  // Validate required fields
  if (!formData.value.title.trim()) {
    errorMessage.value = 'Please enter a title';
    return;
  }

  if (!formData.value.category) {
    errorMessage.value = 'Please select a category';
    return;
  }

  if (!selectedFile.value) {
    errorMessage.value = 'Please select a file';
    return;
  }

  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.value.title);
    formDataToSend.append('author', formData.value.author);
    formDataToSend.append('category', formData.value.category);
    formDataToSend.append('description', formData.value.description);
    formDataToSend.append('file', selectedFile.value);
    
    // Append cover image if provided
    if (selectedCover.value) {
      formDataToSend.append('cover', selectedCover.value);
    }

    const response = await libraryService.uploadItem(formDataToSend);
    successMessage.value = 'Item uploaded successfully!';
    resetForm();
    loadUploadedItems();
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to upload item';
    console.error('Upload error:', error);
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  formData.value = {
    title: '',
    author: '',
    category: '',
    description: '',
  };
  selectedFile.value = null;
  selectedCover.value = null;
  coverPreview.value = '';
  successMessage.value = '';
  errorMessage.value = '';
};

const loadUploadedItems = async () => {
  try {
    const response = await libraryService.getAllItems();
    uploadedItems.value = (response.items || []).slice(0, 10);
  } catch (error) {
    console.error('Failed to load uploaded items:', error);
  }
};

const deleteItem = async (id: number) => {
  if (confirm('Are you sure you want to delete this item?')) {
    try {
      await libraryService.deleteItem(id);
      successMessage.value = 'Item deleted successfully';
      loadUploadedItems();
    } catch (error: any) {
      errorMessage.value = error.message || 'Failed to delete item';
    }
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const formatCategory = (category: string) => {
  return category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

onMounted(() => {
  loadUploadedItems();
});
</script>

<style scoped>
.upload-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.upload-header {
  text-align: center;
  margin-bottom: 2rem;
}

.upload-header h1 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.upload-header p {
  color: #666;
}

.upload-form {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.file-upload {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s;
}

.file-upload:hover {
  border-color: #0066cc;
  background: #f9f9f9;
}

.file-upload input[type='file'] {
  display: none;
}

.file-upload label {
  cursor: pointer;
}

.file-help {
  color: #999;
  font-size: 0.9rem;
  margin: 0.5rem 0 0 0;
}

.file-info {
  color: #0066cc;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.cover-preview {
  margin-top: 1rem;
  text-align: center;
}

.cover-preview img {
  max-width: 200px;
  max-height: 300px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #0066cc;
  color: white;
  flex: 1;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0052a3;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background-color: #e8e8e8;
}

.message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 6px;
  font-weight: 500;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.uploaded-items {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.uploaded-items h2 {
  margin: 0 0 1.5rem 0;
  color: #333;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table thead {
  background-color: #f5f5f5;
  border-bottom: 2px solid #ddd;
}

.items-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333;
}

.items-table td {
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.items-table tbody tr:hover {
  background-color: #f9f9f9;
}

.category-badge {
  display: inline-block;
  background: #e8f4f8;
  color: #0066cc;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
}

.btn-delete {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
}

.btn-delete:hover {
  opacity: 0.7;
}

.no-items {
  text-align: center;
  padding: 2rem;
  color: #999;
}
</style>
