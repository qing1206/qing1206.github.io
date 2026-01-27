/**
 * 修正时区问题的辅助函数
 * 此脚本在 Hexo 执行时自动加载
 */

// 为 Nunjucks 添加一个新的 helper 函数，用于正确处理时区
hexo.extend.helper.register('localDate', function(date, format) {
  if (!date) return '';
  
  // 确保日期是标准格式
  const moment = require('moment');
  // 指定时区为 'Asia/Shanghai'
  const localDate = moment(date).utcOffset(8);
  
  return localDate.format(format || 'YYYY-MM-DD HH:mm:ss');
});
