layui.use(['form','layer'], function() {
    var $ = layui.$,form = layui.form,layer = layui.layer;
    form.render();
    //提交
    form.on('submit(login)', function(obj) {
        console.log(obj);
        //请求后台数据
        $.ajax({
            url : '/center/login/index',
            type : 'post',
            data : obj.field,
            success : function(res){
                if(res.success){
                    location.href = '/center/index/index';
                }else{
                    layer.msg(res.msg);
                }
            }
        });
        //暂时跳转index.html
        // location.href = 'index.html'
    });
});