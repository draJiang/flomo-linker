import re
import requests
import json
import time

from pyquery import PyQuery as pq

from gensim import corpora,models,similarities
import jieba
from requests.api import request
from flask_cors import CORS


from flask import Flask
import flask

import subprocess

# flomo token 和 cookie，通过抓包获取
TOKEN = ''
COOKIE = ''
# 前端界面的路径
UI = r'my-app/build/index.html'

INDEX = None
DICTIONARY = None
TFIDF = None
MEMOS_HTML = None

def my_sort(obj):
    return obj['sim']

app = Flask(__name__)
@app.route('/',methods = ['GET','POST'])

def flomo():
    '''
    根据 UI 中提交的信息，返回几条相关的笔记
    '''
    keyword = flask.request.args.get('keyword')
    
    new_vec = DICTIONARY.doc2bow(jieba.lcut(keyword))

    sim = INDEX[TFIDF[new_vec]]


    req = []

    for i in range(len(sim)):
        req.append({'content':MEMOS_HTML[i]['content'],'sim':float(sim[i]),'slug':MEMOS_HTML[i]['slug'],})

    req = sorted(req,key=lambda x:x['sim'],reverse=True)

    new_req = []

    for i in range(10):
        # 只返回前 10 条匹配结果
        new_req.append(req[i])

    return {'data':new_req,'succuse':True}

if __name__ =="__main__":
    
    # 打开前端页面
    subprocess.Popen(["open", UI])

    header = {
        'X-XSRF-TOKEN': TOKEN
        ,'cookie':COOKIE
        ,'X-Requested-With':'XMLHttpRequest'
        ,'Referer':'https://flomoapp.com/mine?'
        ,'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36'
    }

    offset = 0
    memos = []
    MEMOS_HTML = []

    # 获取 flomo 数据
    while(True):
        req = requests.get(url = 'https://flomoapp.com/api/memo/?offset='+str(offset)+'&tz=8:0',headers=header)
        req_json = json.loads(req.text)
        offset += len(req_json['memos'])

        print(offset)
        
        for item in req_json['memos']:
            
            MEMOS_HTML.append({'content':item['content'],'slug':item['slug'],'tags':item['tags']})
            res = re.compile(u'[\U00010000-\U0010ffff\\uD800-\\uDBFF\\uDC00-\\uDFFF]')
            content = pq(res.sub('',item['content'])).text()
            content = content.replace('\n','')
            memos.append({'content':content,'slug':item['slug'],'tags':item['tags']})
        
        time.sleep(2)

        if(len(req_json['memos'])<=0):
            break

    # 构建 memos 的向量集
    texts = []

    for item in memos:
        texts.append(item['content'])

    texts = [jieba.lcut(text) for text in texts]
    # 建立词典
    DICTIONARY = corpora.Dictionary(texts)
    # 词典特征数
    num_featrues = len(DICTIONARY.token2id)
    # 稀疏向量集
    corpus = [DICTIONARY.doc2bow(text) for text in texts]
    # 创建 TF-IDF 模型
    TFIDF = models.TfidfModel(corpus)

    INDEX = similarities.SparseMatrixSimilarity(TFIDF[corpus],num_featrues)

    # 接口
    CORS(app,resources=r'/*')
    app.run(debug=False,host='0.0.0.0',port=8888)
    