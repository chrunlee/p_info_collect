/**系统内关于数据请求获取的处理**/
'use strict';
layui.define(['jquery','layer'],function(exports){
    var layer = layui.layer,$ = layui.jquery;

    var showLoad = function(flag/**true/false:开启关闭**/){
        //判断页面中是否已经有内容
        if($('.layui-layer-loading').length == 0 && flag === true){
            //过滤
            layer.load(1);
        }else if(flag === false){//close
            setTimeout(function(){
                if($('.layui-layer-loading').length > 0){
                    layer.close($('.layui-layer-loading').attr('times'));
                }
            },200);
        }
    }

    var Model = function(){
        var AJAX = function(url,type){
            return function(data,show){//增加字段是否展示遮罩，默认true
                show = false === show ? false : true;
                return new Promise(function(resolve,reject){
                    if(show)showLoad(true);
                    $.ajax({
                        url : url,
                        type : type || 'POST',
                        data : data || {},
                        success : function(res){
                            //一般都是json数据
                            var resobj ;
                            try{
                                resobj = JSON.parse(res);
                            }catch(e){
                                resobj = res;
                            }
                            if(show)showLoad(false);
                            resolve(resobj);
                        },
                        error : function(xhr,text){
                            showLoad(false);
                            reject(url+':'+text);
                        }
                    });
                });
                
            };
        };
        //warning: config中的url的key要与methodKey的第一个值相同，例如，想要增加一个函数，
        //在methodKey中增加'updateData',那么对应config中要增加 updateDataURL 值，用于保存或查询。
        var config = {
            testURL : base+'/test',
            commentSaveURL : base+'/center/index/commentSave',
            userLoadURL: base + '/center/index/userList',
            attachLoadURL : base+'/center/index/attachList',
            qrcodeSaveURL: base + '/center/index/qrcodeSave',
            systemSetUpdateURL : base+'/center/index/systemSetUpdate'
        };
        //methodName,methodType,parseJson
        var methodKey = [
            'test,POST',
            'commentSave',
            'userLoad',
            'attachLoad',
            'qrcodeSave',
            'systemSetUpdate',
            'schoolSave',
            'schoolDelete',
            'updateSchoolStatus'
            
        ],method= {};
        methodKey.forEach(function(item){
            var ps = item.split(','),
                name = ps[0],
                type = ps.length > 1 ? ps[1] : 'POST';
            method[name] = AJAX(config[name+'URL'] || (base+'/center/index/'+name),type);
        });
        return method;
    }
    var dao = Model();
    exports('dao',dao);
});