/***
 * 微信公众号工具集
 * nodejs 使用。
 * @author chrunlee
 * @version 1.0
 * @since 2020年4月7日 17:07:22
 */
 const fs = require('fs');
 const crypto = require('crypto');
 
  /***
   * @params {String} appid : 微信公众号ID
   * @params {String} appkey : 微信公众号密钥
   * @params {String} token : 公众号填写的token
   * @params {String} cachefilepath : access_token 等信息存储的文件地址（如果需要存数据库或redis等其他方式，需进行处理修改）
   */
 function weixin(appid,appkey,token,cachefilepath) {
     if(!appid || !appkey || !token){
         throw new Error('微信公众号参数配置错误!');
     }
     this.appid = appid;
     this.appkey = appkey;
     this.token = token;
     //设置数据存储文件-->默认在cache
     this.cachefilepath = cachefilepath || '../../../runtime/config/weixin.json';
 
     /***
      * 校验签名是否正确
      * @params {String} signature : 签名
      * @params {String} timestamp : 时间戳
      * @params {String} nonce : 随机字符串
      * @return {boolean} result
      */
     this.validate = function(signature,timestamp,nonce){
         return crypto.createHash('sha1').update([this.token,timestamp,nonce].sort().join('')).digest('hex') == signature;
     }
 
 
     //定义一系列的api接口处理
 
     //接入相关的api
     this.access = {
         /****
          * 获取server端的access_token 数据以及超时时间
          * @return {Object} access_token : 
          * {
          *      access_token : 'xxxx',
          *      expires_in : 1111111111
          * }
          */
         access_token : async function(){
             if(!fs.existsSync(filePath)){
                 fs.writeFileSync(filePath,'{}');
             }
             let current = fs.readFileSync(filePath);
             current = JSON.parse(current);
             let data = current.server || {};
             if(!data || !data.access_token || data.timestamp < +new Date()){
                 //重新请求access_token
                 let url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appid}&secret=${this.appkey}`;
                 let result = await axios.get(url).then(rs=>rs.data);
                 //判断是否返回正确，错误的话扔异常
                 if(result.errcode && result.errcode != '0'){
                     throw new Error('微信公众号:获取access_token失败,'+JSON.stringify(result));
                 }
                 result.timestamp = (+new Date() + result.expires_in*1000);
                 current.server = result;
                 fs.writeFileSync(filePath,JSON.stringify(current));
             }
             return current.server;
         }
     }
 }