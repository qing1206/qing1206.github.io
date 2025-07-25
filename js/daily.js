// Daily page interactions
document.addEventListener('DOMContentLoaded', function() {
  // 初始化图片灯箱效果
  const dailyImages = document.querySelectorAll('.daily-item__image img');
  
  if (typeof lightGallery === 'function' && dailyImages.length > 0) {
    lightGallery(document.querySelector('.daily-timeline'), {
      selector: '.daily-item__image img',
      download: false,
      counter: false,
      enableSwipe: true,
      backdropDuration: 200,
      speed: 500
    });
    
    // 给所有图片添加点击效果
    dailyImages.forEach(img => {
      img.style.cursor = 'pointer';
    });
  }

  // 返回顶部按钮
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

  // 给每个月份分隔符添加动画效果
  const monthDividers = document.querySelectorAll('.daily-month-divider');
  
  if ('IntersectionObserver' in window && monthDividers.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target); // 只触发一次
        }
      });
    }, { threshold: 0.1 });

    monthDividers.forEach(divider => {
      divider.style.opacity = '0';
      divider.style.transform = 'translateY(20px)';
      divider.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      observer.observe(divider);
    });
  }

  // 添加时间轴项目的交错出现效果
  const dailyItems = document.querySelectorAll('.daily-item');
  
  if ('IntersectionObserver' in window && dailyItems.length > 0) {
    const itemObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // 使用CSS变量设置延迟，以支持项目按顺序显示
          const delay = parseInt(entry.target.dataset.index || 0) * 150;
          entry.target.style.animationDelay = `${delay}ms`;
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          itemObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -10% 0px' });
    
    dailyItems.forEach((item, index) => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(30px)';
      item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      item.dataset.index = index;
      itemObserver.observe(item);
    });
  }
  
  // 为日志内容添加淡入效果
  const contents = document.querySelectorAll('.daily-item__content');
  
  if ('IntersectionObserver' in window && contents.length > 0) {
    const contentObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          contentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    
    contents.forEach((content) => {
      content.style.opacity = '0';
      content.style.transform = 'translateY(20px)';
      content.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
      contentObserver.observe(content);
    });
  }
  
  // ===== 添加时间排序功能 =====
  const timeline = document.querySelector('.daily-timeline');
  const sortButton = document.querySelector('.daily-sort-btn');
  
  if (timeline && sortButton) {
    // 获取默认排序方式
    let defaultSort = timeline.dataset.defaultSort || 'desc'; // 默认倒序排列（最新的在前面）
    
    // 从本地存储中读取用户首选排序
    let currentSort = localStorage.getItem('daily-sort-preference') || defaultSort;
    sortButton.setAttribute('data-sort', currentSort);
    
    // 初始化页面上的排序按钮状态
    updateSortButtonState();
    
    // 首次加载时如果存储中的排序与页面默认不同，执行排序
    if (currentSort !== defaultSort) {
      sortItems(currentSort);
    }
    
    // 添加排序按钮点击事件
    sortButton.addEventListener('click', function() {
      // 切换排序方式
      currentSort = currentSort === 'desc' ? 'asc' : 'desc';
      
      // 更新按钮属性和外观
      sortButton.setAttribute('data-sort', currentSort);
      updateSortButtonState();
      
      // 执行排序
      sortItems(currentSort);
      
      // 保存用户偏好
      localStorage.setItem('daily-sort-preference', currentSort);
      
      // 滚动到顶部
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
    
    // 更新排序按钮的状态和文字
    function updateSortButtonState() {
      if (currentSort === 'desc') {
        sortButton.classList.remove('asc');
        sortButton.classList.add('desc');
      } else {
        sortButton.classList.remove('desc');
        sortButton.classList.add('asc');
      }
    }
    
    // 排序日志项目
    function sortItems(sortOrder) {
      const container = document.querySelector('.daily-timeline');
      const items = Array.from(document.querySelectorAll('.daily-item'));
      
      // 移除所有月份分隔符
      const dividers = document.querySelectorAll('.daily-month-divider');
      dividers.forEach(divider => divider.remove());
      
      // 根据日期排序所有项
      items.sort((a, b) => {
        const dateA = parseInt(a.dataset.date);
        const dateB = parseInt(b.dataset.date);
        
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
      
      // 临时移除所有项目
      items.forEach(item => item.remove());
      
      // 重新组织月份分隔符和项目
      let currentMonth = '';
      items.forEach((item, index) => {
        // 从时间戳重建日期对象
        const itemDate = new Date(parseInt(item.dataset.date));
        const year = itemDate.getFullYear();
        const month = itemDate.getMonth() + 1;
        const itemMonth = `${year}年${String(month).padStart(2, '0')}月`;
        
        // 如果月份变化，添加新的月份分隔符
        if (currentMonth !== itemMonth) {
          currentMonth = itemMonth;
          const divider = document.createElement('div');
          divider.className = 'daily-month-divider';
          
          const span = document.createElement('span');
          span.textContent = currentMonth;
          divider.appendChild(span);
          
          container.appendChild(divider);
        }
        
        // 重新添加项目
        container.appendChild(item);
        item.dataset.index = index; // 更新索引以保持动画效果
      });
      
      // 重新初始化月份分隔符动画
      initMonthDividerAnimation();
    }
    
    // 初始化月份分隔符动画
    function initMonthDividerAnimation() {
      const newDividers = document.querySelectorAll('.daily-month-divider');
      
      if ('IntersectionObserver' in window && newDividers.length > 0) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1 });
        
        newDividers.forEach(divider => {
          divider.style.opacity = '0';
          divider.style.transform = 'translateY(20px)';
          divider.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
          observer.observe(divider);
        });
      }
    }
  }
});
