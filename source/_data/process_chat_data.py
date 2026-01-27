import pandas as pd
import numpy as np
import json
import re
import emoji
import jieba
from collections import Counter
from datetime import datetime
import matplotlib.pyplot as plt
from wordcloud import WordCloud
import os

def process_chat_data(csv_file, output_file="chat-data.json"):
    """
    处理聊天记录CSV文件，生成分析数据并导出为JSON格式
    
    参数：
    csv_file: CSV格式的聊天记录文件路径
    output_file: 输出的JSON文件路径
    """
    print("开始处理聊天数据...")
    
    # 读取CSV文件
    df = pd.read_csv(csv_file)
    
    # 数据清洗和预处理
    # 转换时间戳为datetime对象
    df['CreateTime'] = pd.to_datetime(df['CreateTime'], unit='s')
    df['Date'] = df['CreateTime'].dt.date
    df['Hour'] = df['CreateTime'].dt.hour
    df['Day'] = df['CreateTime'].dt.dayofweek  # 0=Monday, 6=Sunday
    df['Month'] = df['CreateTime'].dt.month
    df['Year'] = df['CreateTime'].dt.year
    df['YearMonth'] = df['CreateTime'].dt.strftime('%Y-%m')
    
    # 转换发送者标识
    your_id = "wxid_7gipedh8nrbm22"  # 对方ID
    my_id = "wxid_jkhetex8lgjx22"    # 自己的ID
    
    # 添加发送者类型列
    df['SenderType'] = df['Sender'].apply(lambda x: 'you' if x == your_id else 'me')
    
    print(f"总共读取了 {len(df)} 条消息记录")
    
    # 1. 基础统计信息 =========================================================
    total_days = len(df['Date'].unique())
    your_messages = len(df[df['Sender'] == your_id])
    my_messages = len(df[df['Sender'] == my_id])
    
    stats = {
        'totalMessages': len(df),
        'totalDays': total_days,
        'avgMessages': len(df) / total_days if total_days > 0 else 0,
        'yourMessages': your_messages,
        'myMessages': my_messages
    }
    
    print(f"基础统计信息: {total_days}天, {your_messages}:{my_messages} 消息比例")
    
    # 2. 聊天趋势数据（按日期） ==============================================
    # 按日期聚合消息数
    daily_counts = df.groupby(df['CreateTime'].dt.strftime('%Y-%m-%d')).size()
    trends = {
        'dates': daily_counts.index.tolist(),
        'counts': daily_counts.values.tolist()
    }
    
    print(f"生成聊天趋势数据，包含 {len(daily_counts)} 天的记录")
    
    # 3. 消息类型分布 ========================================================
    # 定义消息类型
    message_types = {
        1: '文字消息',
        3: '图片消息',
        34: '语音消息',
        43: '视频消息',
        47: '表情/动图',
        48: '位置信息',
        49: '通知/卡片',
        50: '通话记录',
        10000: '系统消息'
    }
    
    # 转换Type为可识别的类型
    df['MessageTypeName'] = df['Type'].apply(lambda t: message_types.get(t, '其他类型'))
    
    # 统计各类型消息数
    type_counts = df['MessageTypeName'].value_counts()
    
    message_types_data = {
        'types': type_counts.index.tolist(),
        'counts': type_counts.values.tolist()
    }
    
    print(f"分析消息类型分布: {len(type_counts)} 种类型")
    
    # 4. 周热力图数据（每周每天每小时的消息量） ================================
    # 初始化热力图数据结构 [周日, 周一, ..., 周六][0-23小时]
    weekly_heatmap = [[0 for _ in range(24)] for _ in range(7)]
    
    # 重新排序，使周日为一周的第一天（index 0）
    df['AdjustedDay'] = (df['Day'] + 1) % 7  # 转换为周日=0, 周一=1, ...
    
    # 按天和小时聚合消息数
    day_hour_counts = df.groupby(['AdjustedDay', 'Hour']).size().reset_index(name='count')
    
    # 填充热力图数据
    for _, row in day_hour_counts.iterrows():
        day = int(row['AdjustedDay'])
        hour = int(row['Hour'])
        count = row['count']
        weekly_heatmap[day][hour] = count
    
    print("生成周热力图数据完成")
    
    # 5. 日内分布图（每小时发送者分布） ========================================
    # 初始化数据结构
    hours = list(range(24))
    you_hourly = [0] * 24
    me_hourly = [0] * 24
    
    # 按发送者和小时聚合
    sender_hour_counts = df.groupby(['SenderType', 'Hour']).size().reset_index(name='count')
    
    for _, row in sender_hour_counts.iterrows():
        sender = row['SenderType']
        hour = int(row['Hour'])
        count = row['count']
        
        if sender == 'you':
            you_hourly[hour] = count
        else:
            me_hourly[hour] = count
    
    daily_distribution = {
        'hours': hours,
        'you': you_hourly,
        'me': me_hourly
    }
    
    print("生成日内分布数据完成")
    
    # 6. 月度比较（每月消息数对比） ===========================================
    # 按年月分组统计
    monthly_data = df.groupby(['Year', 'Month']).size().reset_index(name='count')
    
    # 初始化数据结构
    years = monthly_data['Year'].unique().tolist()
    monthly_comparison = {year: [0] * 12 for year in years}
    
    # 填充数据
    for _, row in monthly_data.iterrows():
        year = int(row['Year'])
        month = int(row['Month']) - 1  # 转为0-11索引
        count = row['count']
        
        if year in monthly_comparison:
            monthly_comparison[year][month] = count
    
    print(f"生成月度比较数据完成，包含 {len(years)} 年的数据")
    
    # 7. 词云数据（文本消息词频统计） ==========================================
    # 只处理文本消息
    text_messages = df[df['Type'] == 1]['StrContent'].dropna().tolist()
    
    # 过滤常见停用词
    stopwords = set(['的', '了', '是', '在', '我', '有', '和', '就', '不', '人',
                   '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去',
                   '你', '会', '着', '没有', '看', '好', '自己', '这'])
    
    # 分词和统计
    word_counts = Counter()
    
    for text in text_messages:
        # 简单过滤非文本内容
        if '<' in text and '>' in text:
            continue
            
        # 使用jieba进行中文分词
        words = jieba.cut(text)
        for word in words:
            # 过滤停用词和单个字符
            if word not in stopwords and len(word) > 1:
                word_counts[word] += 1
    
    # 转换为词云数据格式
    word_freq = [{"name": word, "value": count} for word, count in word_counts.most_common(100)]
    
    print(f"生成词云数据完成，包含 {len(word_freq)} 个词语")
    
    # 8. 表情符号统计 ========================================================
    # 提取表情消息
    emoji_messages = df[df['Type'].isin([1, 47])]  # 文本和表情消息
    
    # 从文本中提取emoji
    emoji_counter = Counter()
    
    # 处理表情消息
    for text in emoji_messages['StrContent'].dropna():
        # 提取emoji字符
        emojis = [c for c in text if c in emoji.EMOJI_DATA]
        emoji_counter.update(emojis)
    
    # 获取前10个最常用的表情
    top_emojis = emoji_counter.most_common(10)
    
    emoji_stats = {
        'emojis': [e[0] for e in top_emojis],
        'counts': [e[1] for e in top_emojis]
    }
    
    print(f"生成表情统计数据完成，找到 {len(emoji_counter)} 种表情")
    
    # 9. 最长对话序列 ========================================================
    # 按日期分组消息
    messages_by_date = {}
    
    for _, row in df.iterrows():
        date_str = row['CreateTime'].strftime('%Y-%m-%d')
        
        if date_str not in messages_by_date:
            messages_by_date[date_str] = []
            
        # 提取消息内容
        content = None
        if row['Type'] == 1:  # 文本消息
            content = row['StrContent'] if isinstance(row['StrContent'], str) else "无内容"
        else:
            content = f"[{message_types.get(row['Type'], '其他类型')}]"
            
        # 添加消息
        messages_by_date[date_str].append({
            'sender': row['SenderType'],
            'time': row['CreateTime'].strftime('%H:%M:%S'),
            'content': content
        })
    
    # 按消息数量排序找出最长对话
    date_message_counts = [(date, len(msgs)) for date, msgs in messages_by_date.items()]
    date_message_counts.sort(key=lambda x: x[1], reverse=True)
    
    # 取前5个最长对话
    longest_conversations = []
    for date, count in date_message_counts[:5]:
        longest_conversations.append({
            'date': date,
            'messageCount': count,
            'messages': messages_by_date[date][:20]  # 只取前20条消息
        })
    
    print(f"找到最长对话，最多的一天有 {date_message_counts[0][1]} 条消息")
    
    # 10. 通话统计 =========================================================
    # 提取通话记录
    call_records = df[df['Type'] == 50]
    
    # 按月统计通话次数
    call_counts_by_month = call_records.groupby('YearMonth').size()
    
    # 估算通话时长（从消息内容中提取）
    call_durations = []
    for content in call_records['StrContent'].dropna():
        # 尝试匹配通话时长模式
        duration_match = re.search(r'通话时长 (\d+):(\d+)(?::(\d+))?', content)
        if duration_match:
            hours = int(duration_match.group(1))
            minutes = int(duration_match.group(2))
            seconds = int(duration_match.group(3)) if duration_match.group(3) else 0
            
            # 转换为分钟
            total_minutes = hours * 60 + minutes + seconds / 60
            call_durations.append(total_minutes)
    
    # 计算每月平均通话时长
    avg_duration = np.mean(call_durations) if call_durations else 0
    avg_durations = [avg_duration] * len(call_counts_by_month)
    
    call_stats = {
        'months': call_counts_by_month.index.tolist(),
        'counts': call_counts_by_month.values.tolist(),
        'avgDurations': avg_durations
    }
    
    print(f"生成通话统计数据完成，共有 {len(call_records)} 条通话记录")
    
    # 11. 模拟情感分析数据（由于真实情感分析需要NLP模型） ======================
    # 为简化处理，这里生成模拟数据
    # 实际应用中可以使用NLP模型进行情感分析
    dates = sorted(df['Date'].unique())[:30]  # 取前30天用于演示
    
    # 生成模拟情感数据
    sentiments = {
        'dates': [str(d) for d in dates],
        'positive': [np.random.randint(20, 60) for _ in dates],
        'neutral': [np.random.randint(20, 40) for _ in dates],
        'negative': [np.random.randint(5, 20) for _ in dates]
    }
    
    print("生成模拟情感分析数据完成")
    
    # 12. 组合所有数据 =======================================================
    result = {
        'stats': stats,
        'trends': trends,
        'messageTypes': message_types_data,
        'weeklyHeatmap': weekly_heatmap,
        'dailyDistribution': daily_distribution,
        'monthlyComparison': monthly_comparison,
        'wordFrequency': word_freq,
        'emojiStats': emoji_stats,
        'longestConversations': longest_conversations,
        'callStats': call_stats,
        'sentimentTrend': sentiments
    }
    
    # Before JSON serialization, add a custom JSON encoder class to handle NumPy types
    class NumpyEncoder(json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, np.integer):
                return int(obj)
            elif isinstance(obj, np.floating):
                return float(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            return json.JSONEncoder.default(self, obj)
    
    # When writing to JSON, use the custom encoder
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2, cls=NumpyEncoder)
    
    print(f"数据处理完成，已保存到 {output_file}")
    return result

if __name__ == "__main__":
    # 设置工作目录（可选）
    # os.chdir('/path/to/your/project')
    
    # 指定输入文件和输出文件
    input_csv = "source/_data/chat.csv"  # 修改为您的CSV文件路径
    output_json = "source/_data/chat-data.json"  # 修改为希望输出的JSON文件路径
    
    # 创建输出目录
    os.makedirs(os.path.dirname(output_json), exist_ok=True)
    
    # 处理数据
    process_chat_data(input_csv, output_json)
