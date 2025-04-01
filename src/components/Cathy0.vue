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

const col = {
  "序号": "no", "上播备注": "commentTV", "手卡备注": "commentCard", "链接备注": "commentLink",
  "款数": "styleNum", "品牌名称-必填": "brand", "品类": "kind", "类别": "sort",
  "SPU-必填": "spu", "SKC": "skc", "商品名称": "name", "图片-必填": "image", "到样尺码": "size", "淘宝链接": "taobao",
  "吊牌价-必填": "price", "天猫价": "priceTmall", "抖音价": "priceDouyin", "搭搭直播价-必填": "priceDaDa",
  "搭搭开价价格（券前）": "priceOpen", "差价": "priceDiff", "折扣-必填": "priceDiscount", "颜色": "color",
  "XS": "xs", "S": "s", "M": "m", "L": "l", "XL": "xl", "现货库存数量-必填": "cnt",
  "非现货库存需要预售几天（能预售多少件）-必填": "cntReview", "推荐尺码": "sizeGood", "尺码表": "sizeList",
  "商家体验分（大于4.7）": "review", "材质": "material", "设计师介绍": "commentDesigner", "一句话卖点": "commentOne",
  "是否有包邮": "shippingFree", "商品链接": "link", "商品id": "id",
  "商品标题": "title", "店铺名称-必填": "shop", "是否运费险-必填": "shippingInsurance", "发货时间": "deliverTime",
  "商品规格（主品+赠品详细规格）": "standard", "保质期": "hedge", "本批次内最早的生产日期": "firstDate", "若是跨境的品发货仓是什么仓": "shippingStore", "包邮快递公司": "deliveryCompany",
  "限购地区（不发货）": "limitArea", "品牌商务": "brandBusiness", "快递单号": "shipNo", "到样时间": "exampleTime", "明星同款": "styleHot", "是否已退样": "exampleReturn"
}

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

    excelHeaders.value = jsonData[0] || [];
    excelData.value = jsonData.slice(1);
    const products = excelData.value.map((m) => {
      const d = {}
      Object.keys(col).forEach((k, i) => {
        console.log('item:', k, i, col[k], d, m)
        d[col[k]] = m[i]
      })

      const img = getImg(d.prodCover)
      const imgLink = (img) ? `${baseLink}${img}.jpg` : ''
      d.prodCoverLink = imgLink
      console.log('m:', d, d.prodCover, imgLink)
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