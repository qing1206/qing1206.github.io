(function() {
  // 瀑布流布局实现
  document.addEventListener('DOMContentLoaded', function() {
    const galleryGrid = document.getElementById('gallery-grid');
    
    // 创建三列结构
    function createWaterfallLayout() {
      // 清空画廊容器
      galleryGrid.innerHTML = '';
      
      // 创建三列
      for (let i = 0; i < 3; i++) {
        const column = document.createElement('div');
        column.className = 'gallery-column';
        column.setAttribute('data-column', i);
        galleryGrid.appendChild(column);
      }
      
      // 获取所有图片项
      const galleryItems = document.querySelectorAll('.gallery-item');
      const columns = document.querySelectorAll('.gallery-column');
      
      // 将已有的图片项移动到列中
      galleryItems.forEach((item, index) => {
        // 将每个项目添加到对应的列中（简单的循环分配）
        const columnIndex = index % columns.length;
        columns[columnIndex].appendChild(item);
        
        // 图片加载后的处理
        const img = item.querySelector('img');
        if (img) {
          img.onload = function() {
            // 图片加载完成后显示
            setTimeout(() => {
              item.style.opacity = '1';
            }, 100 * index);
          };
          
          // 如果图片已经缓存，则直接显示
          if (img.complete) {
            setTimeout(() => {
              item.style.opacity = '1';
            }, 100 * index);
          }
        }
      });
    }
    
    // 初始化瀑布流布局
    if (galleryGrid) {
      // 先克隆所有gallery items，以便重新布局
      const itemsFragment = document.createDocumentFragment();
      const originalItems = document.querySelectorAll('.gallery-item');
      originalItems.forEach(item => {
        itemsFragment.appendChild(item.cloneNode(true));
      });
      
      // 清空并重建画廊结构
      galleryGrid.innerHTML = '';
      
      // 创建三列
      for (let i = 0; i < 3; i++) {
        const column = document.createElement('div');
        column.className = 'gallery-column';
        galleryGrid.appendChild(column);
      }
      
      // 获取列引用
      const columns = document.querySelectorAll('.gallery-column');
      
      // 将图片项分配到三列中
      const items = itemsFragment.childNodes;
      Array.from(items).forEach((item, index) => {
        columns[index % 3].appendChild(item);
      });
      
      // 延迟显示各项
      setTimeout(() => {
        document.querySelectorAll('.gallery-item').forEach((item, index) => {
          setTimeout(() => {
            item.style.opacity = '1';
          }, 100 * index);
        });
      }, 100);
    }
    
    // 初始化lightGallery灯箱效果
    if (typeof lightGallery === 'function' && galleryGrid) {
      const gallery = lightGallery(galleryGrid, {
        selector: '.gallery-image-wrapper img',
        download: false,
        counter: true,
        enableSwipe: true,
        backdropDuration: 200,
        speed: 500,
        // 从img元素的data-sub-html属性获取字幕
        subHtml: '.gallery-image-wrapper img',
        subHtmlSelectorRelative: false,
        appendSubHtmlTo: '.lg-item'
      });

      // 动态注入样式以确保字体大小
      const style = document.createElement('style');
      style.textContent = `
        .lg-sub-html {
          background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.2) 80%, rgba(0, 0, 0, 0) 100%) !important;
          padding-bottom: 30px !important;
          padding-top: 40px !important;
          max-height: none !important;
        }
        .lg-sub-html h4 {
          font-size: 2rem !important;
          line-height: 1.4 !important;
          font-weight: 400 !important;
          color: white !important;
        }
        @media (max-width: 992px) {
          .lg-sub-html h4 {
            font-size: 1.8rem !important;
          }
        }
        @media (max-width: 768px) {
          .lg-sub-html h4 {
            font-size: 1.6rem !important;
          }
        }
        @media (max-width: 480px) {
          .lg-sub-html h4 {
            font-size: 1.4rem !important;
          }
        }
      `;
      document.head.appendChild(style);
      
      // 监听lightGallery事件来修改字幕样式
      galleryGrid.addEventListener('lgAfterSlide', function() {
        const caption = document.querySelector('.lg-sub-html h4');
        if (caption) {
          caption.style.fontSize = '2rem';
          caption.style.fontWeight = '400';
          caption.style.lineHeight = '1.4';
        }
      });

      // 给所有图片添加点击效果
      document.querySelectorAll('.gallery-image-wrapper img').forEach(img => {
        img.style.cursor = 'pointer';
      });
    }
    
    // 实现懒加载
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.getAttribute('data-src');
            
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
            }
            
            observer.unobserve(img);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px 200px 0px' });
      
      document.querySelectorAll('.gallery-image-wrapper img').forEach(img => {
        imageObserver.observe(img);
      });
    }
    
    // 添加返回顶部功能
    const backToTopButton = document.querySelector('.back-to-top');
    
    if (backToTopButton) {
      // 监听滚动事件，控制按钮显示
      window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
          backToTopButton.classList.add('visible');
        } else {
          backToTopButton.classList.remove('visible');
        }
      });

      // 点击按钮返回顶部
      backToTopButton.addEventListener('click', function() {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    }
    
    // 窗口大小变化时重新布局
    window.addEventListener('resize', createWaterfallLayout);
  });
})();