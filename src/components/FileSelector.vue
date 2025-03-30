<template>
  <div class="file-selector">
    <!-- 隐藏的 input 元素 -->
    <input 
      type="file"
      ref="fileInput"
      @change="handleFileSelect"
      :accept="acceptTypes"
      style="display: none;"
    >
    
    <!-- 自定义按钮 -->
    <button @click="triggerFileSelect">
      {{ buttonText }}
    </button>
    
    <!-- 状态显示 -->
    <div v-if="selectedFile" class="file-info">
      <p>已选择文件: {{ selectedFile.name }}</p>
      <p>文件大小: {{ formatFileSize(selectedFile.size) }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  // 可接受的文件类型，如 ".xlsx,.xls"
  acceptTypes: {
    type: String,
    default: '*'
  },
  // 按钮文字
  buttonText: {
    type: String,
    default: '选择文件'
  }
});

const emit = defineEmits(['file-selected']);

const fileInput = ref(null);
const selectedFile = ref(null);

// 触发文件选择
const triggerFileSelect = () => {
  fileInput.value.click();
};

// 处理文件选择
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // 验证文件类型
  if (!validateFileType(file)) {
    alert('不支持的文件类型');
    return;
  }

  selectedFile.value = file;
  emit('file-selected', file);
};

// 文件类型验证
const validateFileType = (file) => {
  const allowedTypes = props.acceptTypes.split(',').map(t => t.trim());
  if (allowedTypes.includes('*')) return true;
  
  const extension = file.name.split('.').pop().toLowerCase();
  return allowedTypes.some(type => {
    if (type.startsWith('.')) {
      return type.slice(1) === extension;
    }
    return type === file.type;
  });
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>

<style scoped>
.file-selector {
  margin: 20px 0;
}

button {
  padding: 10px 20px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.file-info {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid #eee;
}
</style>