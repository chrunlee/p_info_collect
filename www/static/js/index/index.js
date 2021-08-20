/**首页整体布局以及事件处理**/
layui.use(['element','layer','tool'],function(){
    var $ = layui.jquery,
        element = layui.element,
        layer = layui.layer,
        tool = layui.tool;
    
    var tools = {
        //1.展示某ID
        showMenu : function(href){
            var $menu = $('#topmenu'),$body = $('.index-body'),$left = $('#sidemenu');
            $menu.find('.index-show').removeClass('index-show');
            $body.find('.index-show').removeClass('index-show');
            $left.find('.layui-this').removeClass('layui-this');
            $menu.find('li[data-href="'+href+'"]').addClass('index-show');
            $body.find('.index-frame[data-href="'+href+'"]').addClass('index-show');
            $left.find('li[data-href="'+href+'"]').addClass('layui-this');
        },
        removeMenu : function(href){
            var $menu = $('#topmenu'),$body = $('.index-body'),$left = $('#sidemenu');
            var $now = $menu.find('.index-show'),nowHref = $now.data('href');
            if($menu.children('li').length == 1){
                return;
            }
            if(href === nowHref){//其他menu,不考虑展示
                //查找上一个
                var $next = $now.prev().length > 0 ? $now.prev() : $now.next(),
                    nextHref = $next.data('href');
                tools.showMenu(nextHref);
            }
            $menu.find('li[data-href="'+href+'"]').remove();
            $body.find('.index-frame[data-href="'+href+'"]').remove();
        }
    };
    //事件处理
    var events = {
        //打开菜单
        open : function(data,event){
            var $menu = $('#topmenu'),
                $body = $('.index-body'),
                href = data.href,
                title = data.title||$(this).text()||'新标签页';
            var lihtml = '<li class="index-show" filter="showMenu" data-href="'+href+'" data-title="'+title+'"><span>'+title+'</span><i class="layui-icon layui-unselect layui-tab-close" filter="closeMenu">ဆ</i></li>';
            //检查是否存在
            var isExists = false;
            $menu.find('.index-show').removeClass('index-show');
            $body.find('.index-show').removeClass('index-show');
            $menu.children('li').each(function(index,item){
                var tempHref = $(item).data('href');
                if(tempHref === href){
                    $(item).addClass('index-show');
                    isExists = true;
                    $body.find('.index-frame[data-href="'+href+'"]').addClass('index-show');
                }
            });
            if(!isExists){
                //append
                $menu.append(lihtml);
                //同时添加对应的frame
                $body.append('<div class="index-frame index-show" data-href="'+href+'"><iframe src="'+href+'"></iframe></div>');
            }
        },
        //关闭菜单
        closeMenu : function(data,event){
            console.log('closemenu');
            var $li = $(this).parent();
            var href = $li.data('href');
            tools.removeMenu(href);
            layui.stope(event);
        },
        //点击li标签，显示该标签以及对应的
        showMenu : function(){
            var $li = $(this),href = $li.data('href');
            tools.showMenu(href);
        },
        //左侧面板收起/展开
        collapse : function(){
            $('body').toggleClass('index-collapse');
        },
        //关闭当前打开的菜单
        closeNow : function(){
            //找到当前展示的，关闭其他
            var $menu = $('#topmenu'),$body = $('.index-body');
            var $now = $menu.find('.index-show'),
                href = $now.data('href');
            tools.removeMenu(href);
        },
        //关闭其他的菜单
        closeOther : function(){
            var $menu = $('#topmenu'),$now = $menu.find('.index-show');
            while($now.prev().length > 0 || $now.next().length > 0){
                tools.removeMenu($now.prev().data('href'));
                tools.removeMenu($now.next().data('href'));
            }
        },
        //左侧移动
        leftMove : function(){
            var $menu = $('#topmenu');
            var ulWidth = $menu.width();
            var realWidth = 0;
            $menu.children('li').each(function(index,item){
                realWidth += $(this).outerWidth(true);
            });
            var nowLeft = parseInt($menu.css('left').replace('px',''),10);//-1110px
            var nextLeft = nowLeft - ulWidth;
            if(realWidth > -nextLeft){
                $menu.css('left',nextLeft+'px');
            }
        },
        //右侧移动
        rightMove : function(){
            var $menu = $('#topmenu');
            var ulWidth = $menu.width();
            var realWidth = 0;
            $menu.children('li').each(function(index,item){
                realWidth += $(this).outerWidth(true);
            });
            var nowLeft = parseInt($menu.css('left').replace('px',''),10);//-1110px
            var nextLeft = Math.min(nowLeft + ulWidth,0);
            $menu.css('left',nextLeft+'px');
        },
        //全屏展示
        fullScreen : function(){
            var ele = document.documentElement,
            fn= ele.requestFullScreen || ele.webkitRequestFullScreen || ele.mozRequestFullScreen || ele.msRequestFullscreen;
            "undefined" != typeof fn && fn && fn.call(ele);
            $(this).attr('filter','exitScreen');
        },
        //退出全屏
        exitScreen : function(){
            document.exitFullscreen ? 
            document.exitFullscreen() : 
            document.mozCancelFullScreen ? 
            document.mozCancelFullScreen() : 
            document.webkitCancelFullScreen ? 
            document.webkitCancelFullScreen() : 
            document.msExitFullscreen && document.msExitFullscreen()
            $(this).attr('filter','fullScreen');
        },
        logout : function(){
            location.href = '/center/login/logout'
        }
    };
    //事件绑定
    tool.bindEvents(events);
    
    //鼠标移入左侧合并后的图标后，进行提示
    $('body').on('mouseenter','li[filter="open"]',function(event){
        var $li = $(this),width = $li.width();
        if(width <= 60){
            layer.tips($li.data('title')||'',$li);
        }
    })
    //默认加载后打开第一个首页
    var $firstMenu = $($('#sidemenu').find('li').eq(0));
    events['open'].call($firstMenu,$firstMenu.data(),null);
})