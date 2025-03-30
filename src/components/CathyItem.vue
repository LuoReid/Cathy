<template>
  <div class="product-container">
    <!-- Product Header -->
    <div class="product-header">     
      <div class="product-name">品牌名</div>
      <div class="product-value">{{ p.brand}}</div>
      <div class="product-name">直播价格</div>
      <div class="product-value product-red">{{ p.price }} ({{ Math.ceil( p.price/p.priceMarket*100)/10 }}折)</div>
      <div class="product-name">市场价格</div>
      <div class="product-value">吊牌价{{ p.priceMarket }}</div>
    </div>
      <div class="product-header">    
      <div class="product-name">产品名称/货号</div>
      <div class="product-value"><p>{{ p.kind }}</P><p>{{ p.prodNo }}</P></div>
      <div class="product-name">成份</div>
      <div class="product-value  product-more">{{ p.material }}</div>
    </div>
        <!-- Material & Features -->
    <div class="box-desc">
      <div class="desc-left">        
        <div class="desc-comment">
          {{p.comment}}
        </div>
        
        <div class="desc-comment">
          {{p.prodName}}
        </div>
      </div>
      <div class="desc-right">        
        <div class="desc-cover">
          <image class="cover-img" :src="p.prodCoverLink"  />
          {{p.prodCover}}
        </div>       
        <div class="desc-cnt">
          <table> 
      <tbody>
        <tr   >
          <td  >XS</td>
          <td  >{{ p.xs }}</td>
        </tr>
        <tr   >
          <td  >S</td>
          <td  >{{ p.s }}</td>
        </tr>
        <tr   >
          <td  >M</td>
          <td  >{{ p.m }}</td>
        </tr>
        <tr   >
          <td  >L</td>
          <td  >{{ p.l }}</td>
        </tr>
        <tr   >
          <td  >XL</td>
          <td  >{{ p.xl }}</td>
        </tr>
      </tbody>
      </table>
        </div>        
        <div class="desc-size">
          有运费险
        </div>
      </div>
    </div>

    <!-- Price Section -->
    <div class="price-section">
      <div class="discount-price">
      </div>
      <div class="original-price">
        市场价: <del>¥{{ p.prodPrice }}</del>
      </div>
    </div>
    <!-- Size Chart -->
    <div class="size-section" v-if="p.sizes?.length">
      <h3 class="section-title">尺码表 (单位: cm)</h3>
      <table class="size-table">
        <thead>
          <tr>
            <th v-for="(header, index) in sizeHeaders" :key="index">{{ header }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(size, index) in p.sizes" :key="index">
            <td v-for="(value, key) in size" :key="key">{{ value }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Brand Info -->
    <div class="brand-section" v-if="brandInfo">
      <div class="brand-column" v-if="p.description || p.stars?.length">
        <h3 class="section-title">品牌信息</h3>
        <p v-if="p.description">{{ p.description }}</p>
        <div class="star-list" v-if="p.stars?.length">
          <span class="star-label">明星同款:</span>
          <span v-for="(star, index) in p.stars" :key="index" class="star-item">
            {{ star }}{{ index < p.stars.length - 1 ? '，' : '' }}
          </span>
        </div>
      </div>
      <div class="store-column" v-if="p.stores?.length">
        <h3 class="section-title">线下门店</h3>
        <ul class="store-list">
          <li v-for="(store, index) in p.stores" :key="index">{{ store }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, onMounted } from 'vue';

const props = defineProps({
  // 产品信息
  p: {
    type: Object,
    required: true, 
  },
   
  
  // 尺码表头（可自定义）
  sizeHeaders: {
    type: Array,
    default: () => ['尺码', '肩宽', '胸围', '袖长', '衣长']
  },
});
const regex = /ID_[A-Z0-9]+/
const getImg = async(p) =>{
  const filePath = p.prodCover
  console.log('load image:',filePath)
  if(filePath){
  const match = filePath.match(regex) 
  const imgName = match && match[0]
  if(imgName){
    p.prodCoverLink = await window.electronAPI.getSafePath(imgName)
    console.log('img:',p.prodCoverLink,imgName)
  }
  } 
}
onMounted(()=>{ console.log('init p:') })
</script>

<style scoped>
.product-container {
  width: 297mm;
  height:210mm;
  margin: 20px auto;
  padding: 25px;
  background: #fff;
  box-shadow: 0 2px 15px rgba(0,0,0,0.1);
  font-family: 'Helvetica Neue', Arial, sans-serif;
  border: 1px dashed purple;
}

.product-header { 
  padding-bottom: 5px;
  display:flex;
}

.product-name {
  color: white;
  background:purple;
  margin: 0;
  font-size: 20px;
  /* flex-basis: 20%;s */
  min-width:100px;
  max-height:56px; 
  text-align:center;  
}

.product-value {
  color: #000; 
  font-size:24px; 
  align-items:flex-start;
  flex-basis:20%;
  border:1px solid #666;
  text-align:center;
}
.product-red{
  color:red;
  font-weight:bold;
}
.product-more{
  flex-basis:auto;
  text-align:flex-start;
}
.box-desc{
  display:flex;
  width:100%;
  color:#333;
}
.desc-left{
  width:60%;
  border:1px dashed skyblue;
}
.desc-comment{
  min-height:30vh;
}ss
.desc-right{
  width:40%;
display:flex;
flex-wrap:wrap;
  border:1px dashed skyblue;
}
.desc-cover{
  width:50%;
}
.cover-img{
  display:block;
  max-width:99%; 
  height:auto;
  height:150px;
  padding:2px;
border:1px dashed blue;
}
.desc-cnt{
  width:50%;
}
.desc-size{
  width:100%;
}

.price-section {
  display: flex;
  align-items: baseline;
  gap: 20px;
  margin: 20px 0;
}

.discount-price {
  color: #e4393c;
  font-size: 28px;
  font-weight: bold;
}

.discount-rate {
  font-size: 16px;
  margin-left: 8px;
}

.original-price {
  color: #999;
  font-size: 14px;
}

.spec-section {
  margin: 25px 0;
}

.material {
  color: #666;
  margin-bottom: 15px;
  font-size: 14px;
}

.highlights {
  display: grid;
  gap: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #f8f8f8;
  border-radius: 4px;
}

.feature-icon {
  color: #e4393c;
}

.size-section {
  margin: 30px 0;
}

.section-title {
  color: #333;
  border-left: 4px solid #e4393c;
  padding-left: 10px;
  margin: 20px 0;
}

.size-table {
  width: 100%;
  border-collapse: collapse;
}

.size-table th,
.size-table td {
  border: 1px solid #eee;
  padding: 12px;
  text-align: center;
}

.size-table th {
  background: #f8f8f8;
}

.brand-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-top: 30px;
}

.star-list {
  margin-top: 10px;
  font-size: 14px;
}

.star-item {
  display: inline-block;
  margin-right: 5px;
}ss

.store-list {
  list-style: none;
  padding: 0;
  margin: 10px 0;
}

.store-list li {
  padding: 5px 0;
  border-bottom: 1px dotted #eee;
}
</style>