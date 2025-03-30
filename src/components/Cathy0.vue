<template>
  <FileSelector accept-types=".xlsx,.xls" button-text="选择 Excel" @file-selected="handleExcelFile" />

  <CathyItem v-for="row in data" :key="row.prodNum" :p="row"></CathyItem>

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
import CathyItem from './CathyItem.vue'

import { onMounted } from 'vue'

const excelHeaders = ref([])
const excelData = ref([])
const data = ref([])

const cols = [
  "款数",
  "品牌名称",
  "品类",
  "类别",
  "吊牌上款号",
  "备注",
  "吊牌上色号",
  "商品名称",
  "图片",
  "到样尺码",
  "淘宝链接",
  "吊牌价",
  "天猫价",
  "抖音价",
  "搭搭直播价",
  "折扣",
  "吊牌上色号",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "现货库存数量",
  "非现货库存需要预售几天能预售多少件）",
  "商家体验分（大于4.7）",
  "材质",
  "一句话卖点",
  "是否有包邮",
  "商品链接",
  "商品id",
  "商品标题",
  "店铺名称",
  "是否运费险",
]
const colsEn =
  [
    "prodNum",
    "brand",
    "kind",
    "prodType",
    "prodNo",
    "comment",
    "prodColor",
    "prodName",
    "prodCover",
    "prodSize",
    "prodLink",
    "priceMarket",
    "prodTmallPrice",
    "prodDouyinPrice",
    "price",
    "prodDiscount",
    "prodColor",
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "cnt",
    "precell",
    "review",
    "material",
    "focus",
    "shipping",
    "link",
    "id",
    "title",
    "shop",
    "freight",
  ]
const regex = /ID_[A-Z0-9]+/
const getImg = (filePath) => {
  console.log('load image:', filePath)
  if (filePath) {
    const match = filePath.match(regex)
    const imgName = match && match[0]
    if (imgName) {
      return imgName
    }
  }
  return null
}
const handleExcelFile = async (file) => {
  // 使用 FileReader 读取文件
  const baseLink = await window.electronAPI.getSafePath('')
  console.log('baseLink:', baseLink)
  const reader = new FileReader()
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result)
    const workbook = read(data, { type: 'array' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = utils.sheet_to_json(worksheet, { header: 1 })

    excelHeaders.value = jsonData[1] || [];
    excelData.value = jsonData.slice(2);
    const products = excelData.value.map((m) => {
      const d = {}
      cols.forEach((h, i) => {
        d[colsEn[i]] = m[i]
      })
      
      const img = getImg(d.prodCover)
      const imgLink = (img) ? `${baseLink}${img}.jpg` : ''
      d.prodCoverLink = imgLink
      console.log('m:', d.prodCover, imgLink)
      return d
    })
    cacheData(products)
    data.value = products

    console.log('row1:', excelHeaders.value)
    console.log('row3:', excelData.value)
    console.log('row4:', data.value[0])
  }

  reader.readAsArrayBuffer(file);
}

const cacheKey = "products-cathy"
const cacheData = (data) => {
  localStorage.setItem(cacheKey, JSON.stringify(data))
}
onMounted(() => {
  const rawData = localStorage.getItem(cacheKey)
  const data0 = JSON.parse(rawData)
  data.value = data0
  console.log('read from local:', data0)
})
</script>