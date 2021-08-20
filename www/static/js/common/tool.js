/**系统内的工具类或相关业务的，比如：通用事件处理等**/

layui.define('jquery', function(exports) {
    var $ = layui.jquery,
        eventsCache = {};

    var tool = {
        
        /****
         * 页面通用绑定点击事件函数
         * 例如:绑定所有带有 filter的函数，并根据值进行回调。
         * <span filter="showMe">Click Me</span> 
         * 那么就可以这样绑定 byy.bindEvents('filter',{
         *     showMe : function(){alert('show me')}
         * })
         * 注意:该函数仅限于点击事件
         **/
        bindEvents: function(type, events) {
            if (typeof type === 'object' || null === type || undefined === type) {
                events = type;
                type = 'filter';
            }
            eventsCache[type] = events;
            delete events;
            $('body').off('click', '[' + type + ']').on('click', '[' + type + ']', function(ev) {
                var $dom = $(this),
                    eventType = $dom.attr(type),
                    data = $dom.data();
                if (eventsCache && eventType && eventsCache[type] && eventsCache[type][eventType]) {
                    eventsCache[type][eventType].call($dom, data, ev);
                }
            });
        },
        //刷新当前选中的tab
        refreshPage : function(){
            var $iframe = $(top.document).find('.index-body .index-frame.index-show iframe');
            $iframe.attr('src',$iframe.attr('src'));
        },
        //刷新父页面，从父页面打开的子页面
        refreshParentPage : function(){
            var $current = $(top.document).find('#topmenu li.index-show');
            var parentHref = $current.data('parent');
            console.log(parentHref);
            if(null != parentHref && undefined != parentHref && '' != parentHref){
                //查找对应的frame
                var $frame = $(top.document).find('.index-frame[data-href="'+parentHref+'"]');
                if($frame.length >0){
                    $frame.find('iframe').attr('src',$frame.find('iframe').attr('src'));
                }
            }
        },
        //创建一个新的tab页面，并选中。
        createNewTab : function(name,url){
            var parentHref = $(top.document).find('#topmenu li.index-show').data('href');
            var title = '<li class="index-show" filter="showMenu" data-href="'+url+'" data-parent="'+parentHref+'" data-title="'+name+'"><span>'+name+'</span><i class="layui-icon layui-unselect layui-tab-close" filter="closeMenu">ဆ</i></li>'
            var frame = '<div class="index-frame index-show" data-href="'+url+'"><iframe src="'+url+'"></iframe></div>';
            //取消所有显示
            $(top.document).find('.index-menu .layui-tab-title li.index-show').removeClass('index-show');
            $(top.document).find('.index-body .index-frame.index-show').removeClass('index-show');
            //add html
            $(top.document).find('#topmenu').append(title);
            $(top.document).find('.index-body').append(frame);
        },
        //关闭当前显示的tab页面
        closeNowTab : function(){
            var $top = $(top.document);
            var $tab = $top.find('#topmenu li.index-show'),
                $frame = $top.find('.index-body .index-frame.index-show');
            if($tab.length > 0){
                $tab.remove();
                $frame.remove();
            }
            //查找嘴一个
            var $lis = $top.find('#topmenu li');
            if($lis.length > 0){
                var $nextLi = $($lis.get($lis.length-1));
                $nextLi.addClass('index-show');
                $top.find('.index-body .index-frame').eq($lis.length-1).addClass('index-show');
            }
        }
    };

    exports('tool', tool);
})