<template>
  <FileSelector 
    accept-types=".xlsx,.xls"
    button-text="选择 Excel"
    @file-selected="handleExcelFile"
  />
  
  <!-- 显示 Excel 内容 -->
  <div v-if="excelData">
    <table>
      <thead>
        <tr>
          <th v-for="(header, index) in excelHeaders" :key="index">{{ header }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rowIndex) in excelData" :key="rowIndex">
          <td v-for="(cell, cellIndex) in row" :key="cellIndex">{{ cell }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { read, utils } from 'xlsx';
import FileSelector from './FileSelector.vue';

const excelHeaders = ref([]);
const excelData = ref([]);

const handleExcelFile = async (file) => {
  // 使用 FileReader 读取文件
  const reader = new FileReader();
  
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = read(data, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = utils.sheet_to_json(worksheet, { header: 1 });
    
    excelHeaders.value = jsonData[0] || [];
    excelData.value = jsonData.slice(1);
  };

  reader.readAsArrayBuffer(file);
};
</script>