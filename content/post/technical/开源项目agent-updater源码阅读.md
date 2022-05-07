+++
date = "2015-09-28T16:30:30+08:00"
draft = false
title = "开源项目agent-updater源码阅读"
Categories = ["技术"]
description = "开源工具Agent-Updater主要用来批量更新所有机器上的Agent。分为Meta和Up..."
menu = "other-mountain"
+++


开源工具Agent-Updater主要用来批量更新所有机器上的Agent。分为Meta和Updater两部分。
<br/>
工具作者<u>[秦晓辉](http://ulricqin.com)</u>，代码在<u>[这里](https://gitcafe.com/ops)</u>，相应的<u>[视频教程](http://my.jikexueyuan.com/4031141286/record/)</u>。
<br/>
本文是我个人的源码阅读笔记。

### __前言__：
agent-updater可以看做是一个微缩版的__部署系统__。
<br/>
之所以这么说，是因为它确确实实做到了部署系统应该做的事：__上线代码、版本管理、甚至小流量的支持__。
<br/>
然而这么说又不太对，就我个人看法，部署系统应该是__与公司业务相关的__，不同的网络、IDC的选型，不同的服务划分的选型，应该有不同的部署解决方案。
<br/>
如果说监控系统还可以独立于业务之外的话，部署系统是实在无法与业务分开，因为部署必须要依赖于服务树，服务树是业务架构的划分，业务线与机器之间的对应关系。


### __整体架构__：
![alt text](/img/blog/updater-read/all-layout.png)

- 项目分为meta和updater两部分
- meta作为一个服务端，用户在meta上统一进行配置
- updater作为一个agent，运行在每台客户端上，向上联系meta获取信息，向下管理着机器上的各种agent


### __Meta__：
![alt text](/img/blog/updater-read/meta-layout.png)

- Config模块，主要加载用户配置，来处理各updater对应的agent版本等信息
- HTTP模块，用来和updater做交互，同时对外提供各updater的状态信息
- DOWNLOAD模块，用来提供一个文件服务器，提供给updater拉取tar包

### __Updater__：
![alt text](/img/blog/updater-read/updater-layout.png)

- HTTP模块，用来和meta交互，上报本机agent信息，下拉配置信息和tar包
- cron模块，用来拉取tar包，部署对应agent，同时获取各agent运行信息

### __配置的加载__：
这是我学习的第一个golang的项目，之前只是使用过beego，看过beego的部分代码。学习UlricQin的这个项目让我受益良多。感谢<u>[UlricQin](http://ulricqin.com)</u>。

- 配置的加载是用的json格式的文件
- 读取直接使用json.Unmarshal即可，需提前定义好结构体
- 放在g包的一个全局变量中，带一把读写锁
<br/>

        var (
            ConfigFile string
            config     *GlobalConfig
            configLock = new(sync.RWMutex)
        )

        func Config() *GlobalConfig {
            configLock.RLock()
            defer configLock.RUnlock()
            return config
        }

### __Heartbeat请求的实现__：
为了解决同时请求meta，造成meta压力过大的问题，要让updater在第一个心跳请求之前sleep一个随机的时间（0 < t < 心跳周期）。
<br/>
第一次心跳请求之后，每次请求sleep心跳骤起的时间就可以了。
<br/>

        func SleepRandomDuration() {
            ns := int64(g.Config().Interval) * time.Second
            // 以当前时间为随机数种子
            r := rand.New(rand.NewSource(time.Now().UnixNano()))
            d := time.Duration(r.Int63n(ns)) * time.Nanosecond
            time.Sleep(d)
        }


### __缺点__：
使用updater上报-下拉的方式，诚然减少了服务端压力，然而meta对于各agent的控制力降低，无法实时监控各agent状态，也无法及时获取到agent的各异常信息。

### __改进__：
服务端维护一个全量的机器列表，不管用DB、内存还是文件。可定时查看各agent详细情况。


### __后记__：
回头想想，使用updater主动连meta的这种方式，确实带来了诸多优点，同时也导致了meta中央控制力的减弱。对agent的状态无法实时掌控，是一个运维工程师无法忍受的。
<br/>
当然也可以通过其他的方式来弥补这一点，比如定时查询状态等，但如此一来，又违反了我们这样设计的初衷。
<br/>
真正的部署系统，是应当与服务树、与公司的业务紧密相关的。所以，UlricQin在视频里说“这并不是一个真正的部署系统，因为一个真正的部署系统应该有各种更加复杂的逻辑”。




<p align="right">2015.9.28</p>
<p align="right">升升</p>
