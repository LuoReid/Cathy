<script setup>
import { ref } from 'vue'
import { genFileId } from 'element-plus'
// import { UploadInstance, UploadProps, UploadRawFile } from 'element-plus'

const upload = ref()
const header = ref()
const sheetData = ref()

const handleExceed = (files) => {
  const rawfile = files[0]
  rawfile.uid = genFileId()
  console.log('files:',files,rawfile)
}

const submitUpload = () => {
  console.log('to subbmit')
}
</script>

<template>
  <div class="greetings">
    <h1 class="green">Cathy</h1>
    <el-upload ref="upload" class="upload-demo" action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
      :limit="1" :on-exceed="handleExceed" :auto-upload="false">
      <template #trigger>
        <el-button type="primary">select file</el-button>
      </template>
      <el-button class="ml-3" type="success" @click="submitUpload">
        upload to server
      </el-button>
      <template #tip>
        <div class="el-upload__tip text-red">
          limit 1 file, new file will cover the old file
        </div>
      </template>
    </el-upload>

    <table v-if="sheetData.length">
      <thead>
        <tr>
          <th v-for="header in headers" :key="header">{{ header }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in sheetData" :key="index">
          <td v-for="(cell, idx) in row" :key="idx">{{ cell }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  position: relative;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
}

.greetings h1,
.greetings h3 {
  text-align: center;
}

@media (min-width: 1024px) {

  .greetings h1,
  .greetings h3 {
    text-align: left;
  }
}

table {
  border-collapse: collapse;
  margin-top: 20px;
}

th,
td {
  border: 1px solid #ddd;
  padding: 8px;
}

th {
  background-color: #f2f2f2;
}
</style>
