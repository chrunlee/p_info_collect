/***
 * 
 * 常用工具集
 * 包括：文件处理、url请求、图片、数据处理等，不涉及额外配置的函数
 * @since 2020年4月7日 16:40:23
 * @version 1.0
 * @author chrunlee
 */

 const Jimp = require('jimp');
 const fs = require('fs');
 const axios = require('axios');
 
 
 module.exports = {
 
     //根据操作不同进行分类
 
     /****
      * 图片压缩质量等工具
      */
     image : {
         /***
          * 将图片进行压缩到某质量,针对原图进行操作
          * @params {String} filePath : 本地图片路径
          * @params {Number} compressVal : 0-100 的质量百分比
          * @return Promise -> err/null 
          */
         compress : function(filePath,compressVal){
             return new Promise(function(resolve,reject){
                 Jimp.read(filePath).then(function(image){
                     image.quality(compressVal).write(filePath);
                     resolve();
                 }).catch(function(err){
                     reject(err);//
                 });
             });
         },
         /***
          * 获得一个图片的base64的转码
          * @params {String} filePath : 本地图片的路径
          * @return Promise -> err/{String} 图片的base64字符串
          */
         base64 : function(filepath){
             return new Promise(function(resolve,reject){
                 fs.readFile(filepath,function(err,content){
                     if(err){
                         reject(err);
                     }else{
                         let str = content.toString('base64');
                         resolve(str)
                     }
                 })
             });
         },
         /****
          * 下载外网图片到本地
          * @params {String} href : 可访问的图片地址
          * @params {String} picpath : 下载后本地的图片文件路径
          * @return Promise -> err/null
          */
         downloadimage : function downloadPicture (href,picpath){
             return new Promise((resolve,reject)=>{
                 axios.get(href,{
                     responseType : 'stream'
                 })
                 .then(rs=>{
                     const ws = fs.createWriteStream(picpath);
                     ws.on('close',()=>{
                         resolve();
                     });
                     ws.on('error',(err)=>{
                         reject(err);
                     })
                     rs.data.pipe(ws);
                 })
                 .catch(err=>{
                     reject(err);
                 })
             });
         }
 
     },
 
     /***
      * mysql 数据库操作相关，比如：备份。
      */
     mysql : {
         /****
          * 导出某个数据库的数据和结构
          * @params {String} ip : 远程IP 或 本地IP，数据库所在的服务器IP地址
          * @params {String} port : 数据库连接的端口
          * @params {String} user : 数据库用户
          * @params {String} pwd : 数据库密码
          * @params {String} database : 数据库名称
          * @params {String} filePath : 导出的文件路径
          * @return Promise -> err/null
          */
         exportdb : function(ip,port,user,pwd,database,filePath){
             let cmd = `mysqldump -h${ip} -port${port} -u${user} -p${pwd} --databases ${database} > ${filePath}`;
             return new Promise((resolve,reject)=>{
                 exec(cmd,(err,stdin,stdout)=>{
                     if(err){
                         reject(err);
                     }else{
                         resolve();
                     }
                 })
             });
         }
 
     },
 
     /***
      * User Agent 判断
      */
     ua : function(agent){
         agent = agent ? agent.toLowerCase() : '';
         var getVersion = function(label){
             var exp = new RegExp(label + '/([^\\s\\_\\-]+)');
             label = (agent.match(exp)||[])[1];
             return label || false;
         };
     
         var result = {
             os: function(){ //底层操作系统
                 var bIsIpad = agent.match(/ipad/i) == "ipad";
                 var bIsIphoneOs = agent.match(/iphone os/i) == "iphone os";
                 var bIsMidp = agent.match(/midp/i) == "midp";
                 var bIsUc7 = agent.match(/rv:1.2.3.4/i) == "rv:1.2.3.4";
                 var bIsUc = agent.match(/ucweb/i) == "ucweb";
                 var bIsAndroid = agent.match(/android/i) == "android";
                 var bIsCE = agent.match(/windows ce/i) == "windows ce";
                 var bIsWM = agent.match(/windows mobile/i) == "windows mobile";
                 var bIsLinux = agent.match(/linux/i) == 'linux';
                 if(bIsIpad || bIsIphoneOs){
                     return 'ios';
                 }else if(bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM){
                     return 'android';
                 }else if(bIsLinux){
                     return 'linux';
                 }else{
                     return 'windows';
                 }
             }()
             ,ff : function(){
                 return agent.indexOf('firefox') > -1;
             }()
             ,safari : function(){
                 return agent.indexOf('safari') > -1 && agent.indexOf('chrome') == -1;
             }()
             ,chrome : function(){
                 return agent.indexOf('chrome') > -1 && agent.indexOf('safari') > -1 && agent.indexOf('edge') < 0;
             }()
             ,opera : function(){
                 return agent.indexOf('opera') > -1;
             }()
             ,weixin: getVersion('micromessenger')  //是否微信
         }
         //移动设备
         result.android = result.os === 'android';///android/.test(agent);
         result.ios = result.os === 'ios';
         return result;
     }
 
 }