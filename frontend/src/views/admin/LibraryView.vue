<template>
  <div class="library-container">
    <div class="library-header">
      <h1>📚 E-Library</h1>
      <p>Access books, documents, and publications</p>
    </div>

    <div class="library-controls">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search books, authors, documents..."
          @input="filterItems"
        />
      </div>

      <div class="category-filter">
        <select v-model="selectedCategory" @change="filterItems">
          <option value="">All Categories</option>
          <option
            v-for="cat in categories"
            :key="cat"
            :value="cat"
          >
            {{ formatCategory(cat) }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <p>Loading library items...</p>
    </div>

    <div v-else-if="filteredItems.length === 0" class="no-items">
      <p>No library items found</p>
    </div>

    <div v-else class="library-grid">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="library-card"
      >
        <div class="card-image">
          <img
            v-if="item.coverImagePath"
            :src="libraryService.getCoverImageUrl(item.id)"
            :alt="item.title"
          />
          <div v-else class="placeholder-image">
            <span class="icon">📄</span>
          </div>
        </div>

        <div class="card-content">
          <h3>{{ item.title }}</h3>
          <p v-if="item.author" class="author">By {{ item.author }}</p>
          <p class="category">{{ formatCategory(item.category) }}</p>

          <div class="stats">
            <span class="stat">👁️ {{ item.viewCount }}</span>
            <span class="stat">⬇️ {{ item.downloadCount }}</span>
          </div>

          <div class="card-actions">
            <button @click="viewItem(item)" class="btn btn-primary">
              View
            </button>
            <button @click="downloadFile(item)" class="btn btn-secondary">
              Download
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Item Detail Modal -->
    <div v-if="selectedItem" class="modal-overlay" @click.self="selectedItem = null">
      <div class="modal">
        <button class="close-btn" @click="selectedItem = null">✕</button>

        <div class="modal-content">
          <div class="modal-image">
            <img
              v-if="selectedItem.coverImagePath"
              :src="libraryService.getCoverImageUrl(selectedItem.id)"
              :alt="selectedItem.title"
            />
            <div v-else class="placeholder-image">
              <span class="icon">📄</span>
            </div>
          </div>

          <div class="modal-details">
            <h2>{{ selectedItem.title }}</h2>
            <p v-if="selectedItem.author" class="author">
              <strong>Author:</strong> {{ selectedItem.author }}
            </p>
            <p class="category">
              <strong>Category:</strong> {{ formatCategory(selectedItem.category) }}
            </p>
            <p v-if="selectedItem.description" class="description">
              {{ selectedItem.description }}
            </p>

            <div class="modal-stats">
              <div class="stat-item">
                <span>Views</span>
                <strong>{{ selectedItem.viewCount }}</strong>
              </div>
              <div class="stat-item">
                <span>Downloads</span>
                <strong>{{ selectedItem.downloadCount }}</strong>
              </div>
              <div class="stat-item">
                <span>File Size</span>
                <strong>{{ formatFileSize(selectedItem.fileSize) }}</strong>
              </div>
              <div class="stat-item">
                <span>Uploaded</span>
                <strong>{{ formatDate(selectedItem.createdAt) }}</strong>
              </div>
            </div>

            <div class="modal-actions">
              <button @click="downloadFile(selectedItem)" class="btn btn-large">
                ⬇️ Download {{ selectedItem.fileName }}
              </button>
              <div class="button-group">
                <button @click="editingItem = { ...selectedItem }" class="btn btn-primary">
                  ✏️ Edit
                </button>
                <button @click="deleteItem(selectedItem.id)" class="btn btn-danger">
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="editingItem" class="modal-overlay" @click.self="editingItem = null">
      <div class="modal">
        <button class="close-btn" @click="editingItem = null">✕</button>

        <div class="modal-content">
          <h2>Edit Library Item</h2>
          <form @submit.prevent="saveEdit" class="edit-form">
            <div class="form-group">
              <label for="edit-title">Title</label>
              <input
                id="edit-title"
                v-model="editingItem.title"
                type="text"
                required
              />
            </div>

            <div class="form-group">
              <label for="edit-author">Author</label>
              <input
                id="edit-author"
                v-model="editingItem.author"
                type="text"
              />
            </div>

            <div class="form-group">
              <label for="edit-category">Category</label>
              <select id="edit-category" v-model="editingItem.category">
                <option value="book">Book</option>
                <option value="document">Document</option>
                <option value="publication">Publication</option>
                <option value="research_paper">Research Paper</option>
                <option value="guide">Guide</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div class="form-group">
              <label for="edit-description">Description</label>
              <textarea
                id="edit-description"
                v-model="editingItem.description"
                rows="4"
              ></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Save Changes</button>
              <button type="button" class="btn btn-secondary" @click="editingItem = null">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { libraryService } from '@/services/library';

const searchQuery = ref('');
const selectedCategory = ref('');
const items = ref<any[]>([]);
const categories = ref<string[]>([]);
const selectedItem = ref<any>(null);
const editingItem = ref<any>(null);
const loading = ref(false);

const filteredItems = computed(() => {
  return items.value.filter((item) => {
    const matchesSearch =
      searchQuery.value === '' ||
      item.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (item.author && item.author.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.value.toLowerCase()));

    const matchesCategory =
      selectedCategory.value === '' || item.category === selectedCategory.value;

    return matchesSearch && matchesCategory;
  });
});

const loadItems = async () => {
  loading.value = true;
  try {
    const response = await libraryService.getAllItems();
    items.value = response.items || [];
  } catch (error) {
    console.error('Failed to load library items:', error);
  } finally {
    loading.value = false;
  }
};

const loadCategories = async () => {
  try {
    const response = await libraryService.getCategories();
    categories.value = response.categories || [];
  } catch (error) {
    console.error('Failed to load categories:', error);
  }
};

const filterItems = () => {
  // Filtering is done via computed property
};

const viewItem = (item: any) => {
  selectedItem.value = item;
};

const downloadFile = async (item: any) => {
  try {
    await libraryService.downloadFile(item.id);
  } catch (error) {
    console.error('Failed to download file:', error);
  }
};

const saveEdit = async () => {
  try {
    const updateData = {
      title: editingItem.value.title,
      author: editingItem.value.author,
      category: editingItem.value.category,
      description: editingItem.value.description,
    };
    await libraryService.updateItem(editingItem.value.id, updateData);
    alert('Item updated successfully!');
    editingItem.value = null;
    selectedItem.value = null;
    await loadItems(); // Reload items to show updated data
  } catch (error: any) {
    console.error('Failed to update item:', error);
    alert('Failed to update item: ' + (error.message || 'Unknown error'));
  }
};

const deleteItem = async (id: number) => {
  if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
    try {
      await libraryService.deleteItem(id);
      alert('Item deleted successfully!');
      selectedItem.value = null;
      await loadItems(); // Reload items after deletion
    } catch (error: any) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item: ' + (error.message || 'Unknown error'));
    }
  }
};

const formatCategory = (category: string) => {
  return category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const truncateText = (text: string, length: number) => {
  return text.length > length ? text.substring(0, length) + '...' : text;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};

onMounted(() => {
  loadItems();
  loadCategories();
});
</script>

<style scoped>
.library-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.library-header {
  text-align: center;
  margin-bottom: 2rem;
}

.library-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.library-header p {
  font-size: 1.1rem;
  color: #666;
}

.library-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 250px;
}

.search-box input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.category-filter {
  min-width: 200px;
}

.category-filter select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  background-color: white;
}

.library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
}

.library-card {
  border: 1px solid #eee;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.library-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.card-image {
  width: 100%;
  aspect-ratio: 6 / 9;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.placeholder-image {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-size: 3rem;
}

.card-content {
  padding: 1.5rem;
}

.card-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.author {
  color: #666;
  font-size: 0.9rem;
  margin: 0.25rem 0;
}

.category {
  display: inline-block;
  background: #e8f4f8;
  color: #0066cc;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  margin: 0.5rem 0;
}

.description {
  color: #666;
  font-size: 0.9rem;
  margin: 0.5rem 0;
}

.stats {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
  color: #999;
  font-size: 0.9rem;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #0066cc;
  color: white;
}

.btn-primary:hover {
  background-color: #0052a3;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background-color: #e8e8e8;
}

.loading,
.no-items {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-size: 1.1rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  max-width: 700px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  z-index: 10;
}

.modal-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  padding: 2rem;
}

.modal-image {
  width: 200px;
  aspect-ratio: 6 / 9;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.modal-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.modal-details h2 {
  margin: 0 0 1rem 0;
  color: #333;
}

.modal-details p {
  margin: 0.5rem 0;
  color: #666;
}

.modal-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-item span {
  display: block;
  color: #999;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.stat-item strong {
  display: block;
  font-size: 1.3rem;
  color: #333;
}

.btn-large {
  width: 100%;
  padding: 0.75rem;
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
}

.btn-large:hover {
  background-color: #0052a3;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
  padding: 0.75rem 1.5rem;
  margin-top: 0.5rem;
}

.btn-danger:hover {
  background-color: #c82333;
}

.edit-form {
  width: 100%;
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
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.form-actions .btn {
  flex: 1;
  padding: 0.75rem;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
}

.button-group {
  display: flex;
  gap: 1rem;
  align-items: stretch;
}

.button-group .btn {
  flex: 1;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  height: auto;
  min-height: 44px;
}

.btn-large {
  margin: 0 !important;
}

@media (max-width: 768px) {
  .modal-content {
    grid-template-columns: 1fr;
  }

  .modal-image {
    width: 100%;
    height: 250px;
  }

  .library-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
}
</style>
