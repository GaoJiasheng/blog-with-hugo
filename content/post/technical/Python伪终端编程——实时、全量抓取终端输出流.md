+++
date = "2016-08-03T9:30:00+08:00"
draft = false
title = "Python伪终端编程——实时、全量抓取终端输出流"
Categories = ["devlop"]
description = "之前在上家公司，堡垒机的审计，是我用C语言开发的。C语言对于流的处理非常的得心应手..."
menu = "develop"
+++

## 引言

之前在上家公司，堡垒机的审计，是我用C语言开发的。C语言对于流的处理非常的得心应手。但是开发效率较低，尤其是对数据的处理部分的开发效率较慢。

好巧，新公司这个需求又到了我手里，本着不直接用老东家代码的原则，又想把更多的精力放在用户体验和其他地方。

因此我选择了**python**做为开发语言。顺便，将**流的抓取过程**分享给大家。

## 背景

如果只是想监听一个普通的文件流，是很简单的事情。只需要select就可以。如果想抓取的话，可以先读出来，存起来，再输出回原来的地方就可以实现。

那么，按照这个理论，我们只要**start一个bash进程，跟它交互，然后直接把输出流抓取出来**，是不是就解决问题了呢？

当然**不是**，有两点原因：

- 普通的输出流，与tty终端设备存在区别。
- bash的回显，并不是tty的输出，命令提示符，在普通的输出流里是没有的。

我来解释一下，普通的文件流和tty是不同的。具体的我们参考下面这段话：

> **/dev/tty** stands for the controlling terminal (if any) for the current process. To find out which tty's are attached to which processes use the "ps -a" command at the shell prompt (command line). Look at the "tty" column. For the shell process you're in, /dev/tty is the terminal you are now using. Type "tty" at the shell prompt to see what it is (see manual pg. tty(1)). /dev/tty is something like a link to the actually terminal device name with some additional features for C-programmers: see the manual page tty(4).

> **From**： [http://tldp.org/HOWTO/Text-Terminal-HOWTO-7.html#ss7.3](http://tldp.org/HOWTO/Text-Terminal-HOWTO-7.html#ss7.3)

再次，bash回显的问题，命令行的提示符（类似于root@localhost#这个东西，由环境变量**PS1**设置），并不是tty的输出，而是bash 通过环境变量 ps1的值 eval 之后，本地输出的。

## 伪终端简介

**tty**一词来源于Teletypes，或者teletypewriters。原指**电传打字机**。后来我们有了更高端的东西，比如键盘和显示器。所以现在称他为**终端**更加合适。

但是我们在很多情况下，比如使用telnet或ssh远程登录一台服务器，也需要像真正的终端一样的交互。

远程的机器，也提供出了一个虚拟的终端供我们交互。这就是**伪终端**（pty，pseudo-terminal slave）。

伪终端，是成对的逻辑终端设备，一个master，一个slave。 对master的操作会反映到slave上。它们与实际物理设备并不直接相关。如果一个程序把ptyp3(master设备)看作是一个串行端口设备，则它对该端口的读/写操作会反映在该逻辑终端设备对应的另一个ttyp3(slave设备)上面。而ttyp3则是另一个程序用于读写操作的逻辑设备。

简言之，master与slave是对应的，你对master的读写，会反映到slave上。而slave是真的逻辑设备，是tty，slave与系统进行交互。而我们只需要与master沟通就可以了。

至于如何把master和slave搞到一起，让他们对接起来。这里就不详细讲了。有兴趣可以参考《Unix环境高级编程》第18、19两章。


## Python创建伪终端

用Python创建伪终端其实只需要一行：

	import os
	pty_pid, pty_fd = os.forkpty()

os.forkpty这个函数，只返回子进程的pid和master设备的fd。程序员都不需要去关注slave。对于这种啥都封装好啥都不用我干的方法，我只想说：“太好用了！T_T”。

我们看下这个方法的介绍：

> os.forkpty()<br/>
> Fork a child process, using a new pseudo-terminal as the child’s controlling terminal. Return a pair of (pid, fd), where pid is 0 in the child, the new child’s process id in the parent, and fd is the file descriptor of the master end of the pseudo-terminal. For a more portable approach, use the pty module. If an error occurs OSError is raised.

> Availability: some flavors of Unix.

> **From**: [https://docs.python.org/2.7/library/os.html#os.forkpty](https://docs.python.org/2.7/library/os.html#os.forkpty)

这样伪终端就创建好了，但是要达到让我们可以像正常bash一样的交互，还需要一些别的操作。

## 设置流为非阻塞

为了达到最终的效果，我们要对流进行一些处理。

先来梳理下我们现在手里有啥，有一个父进程，一个子进程，父进程的各种流，和子进程的master_fd。

首先，我们要把父进程的stdin和stdout设成非阻塞。（具体为啥，不用说，都懂的 ^_^）

	import termios
	import sys
	
	stdout_attr = termios.tcgetattr(sys.stdout.fileno())
    termios.tcsetattr(pty_fd, termios.TCSADRAIN, stdout_attr)
    stdin_attr = termios.tcgetattr(sys.stdin.fileno())
    termios.tcsetattr(pty_fd, termios.TCSADRAIN, stdout_attr)

对于termios库的具体解释，就不多说了，大家可以看下文档就会全明白了。

> termios.tcgetattr(fd)<br/>
> Return a list containing the tty attributes for file descriptor fd, as follows: [iflag, oflag, cflag, lflag, ispeed, ospeed, cc] where cc is a list of the tty special characters (each a string of length 1, except the items with indices VMIN and VTIME, which are integers when these fields are defined). The interpretation of the flags and the speeds as well as the indexing in the cc array must be done using the symbolic constants defined in the termios module.

> termios.tcsetattr(fd, when, attributes)<br/>
> Set the tty attributes for file descriptor fd from the attributes, which is a list like the one returned by tcgetattr(). The when argument determines when the attributes are changed: TCSANOW to change immediately, TCSADRAIN to change after transmitting all queued output, or TCSAFLUSH to change after transmitting all queued output and discarding all queued input.

> **From**: [https://docs.python.org/2.7/library/termios.html#module-termios](https://docs.python.org/2.7/library/termios.html#module-termios)

## 取消控制字符的转化

我们将流设置为非阻塞之后，但是普通的流都会对控制字符进行转化，这样我们按ctrl + L的时候，并不会发送控制字符，而是发送^L这两个普通字符。

这里我们要对流进行处理，让stdin不进行控制字符转化。

	import tty
	import sys
	tty.setraw(sys.stdin.fileno())
	tty.setcbreak(sys.stdin.fileno())

详细tty库请参见：

> tty.setraw(fd[, when])<br/>
> Change the mode of the file descriptor fd to raw. If when is omitted, it defaults to termios.TCSAFLUSH, and is passed to termios.tcsetattr().
    
> tty.setcbreak(fd[, when])<br/>
> Change the mode of file descriptor fd to cbreak. If when is omitted, it defaults to termios.TCSAFLUSH, and is passed to termios.tcsetattr().
    
> **From**: [https://docs.python.org/2.7/library/tty.html#module-tty](https://docs.python.org/2.7/library/tty.html#module-tty)



## 设定窗口大小

大多数UNIX系统都提供了一种功能，可以对当前终端窗口的大小进行跟踪，在窗口大小发生变化时，使内核通知前台进程组。内核为每个终端和伪终端都保存了一个winsize结构。

使用ioctl的TIOCGWINSZ命令可以取此结构的当前值，使用ioctl的TIOCSWINSZ命令，可以将此结构的新值重新存放到内核中。当内核中的数值发生改变时，将向前台发送SIGWINCH信号。

所以我们就要利用这个来更改伪终端窗口大小，代码如下：

	import fcntl
	import sys
	
	s = struct.pack('HHHH', 0, 0, 0, 0)
	#先获取当前进程的窗口大小
	size = fcntl.ioctl(sys.stdout.fileno(), TIOCGWINSZ, s)
	#设置伪终端的窗口大小
	fcntl.ioctl(pty_fd, termios.TIOCSWINSZ, size)


## 忽略SIGCHLD信号

现在我们已经知道，父进程fork了一个子进程出来，子进程里调用了bash。然后用户跟父进程进行交互，父进程将流转发给子进程。

因此，父进程肯定是要有一个for+select的循环的，整个父进程大部分时间都要在这个循环中。

因此父进程要提前就定义好，当子进程退出时候所要做的操作，保证子进程的顺利退出。

	import signal
	signal.signal(signal.SIGCHLD, signal.SIG_IGN)

当子进程要退出的时候，会向父进程发送SIGCHLD信号，如果父进程一直忙于自己的事，将会导致子进程成为**僵尸进程**。这种情况下，父进程也会卡在select这个地方无法进行，整个应用就在这里卡住了。

因此，我们需要显式的要求父进程忽略SIGCHLD信号，保证子进程的退出。


## 主循环

有了上述的这些准备，我们就万事俱备，只欠东风了。

这时候，我们需要做的就是将用户的输入流（stdin）导向伪终端，将伪终端的输出，转移到屏幕（stdout）。

	import os, sys, select
	
	BUFSIZ = 10240
	
	while pty_is_alived(pty_pid):
        rs, ws, _ = select.select([stdin_fd, pty_fd], [pty_fd], [])

        if pty_fd in rs:
            try:
                output = os.read(pty_fd, BUFSIZ)
                #TODO：在这里可以对输出流进行抓取
                os.write(stdout_fd, output）
            #pty_fd偶尔会读写有冲突，所以要忽略临时不可用的情况
            except OSError:
                pass

        if stdin_fd in rs:
            input = os.read(stdin_fd, BUFSIZ)
            #TODO：输入流的抓取在这里
            os.write(pty_fd, input)

	else:
		os.write(stdout_fd, "\n=== USER QUIT! ===\n")

在这个循环中，我们判断子进程的状态，只要子进程存活，我们就去循环。

在每次一开始，我们使用select来对stdin和pty_fd两个流进行监听，select就不多讲了，几乎所有语言都是类似的。

当select返回的时候，我们会判断可读的流，如果stdin可读，我们就将stdin的数据转发到pty_fd。

当pty_fd可读的时候，我们就将数据转发至stdout。

在这两个数据流的转发环节中，我们都可以获取全量的数据流，你可以尽情的将数据记录下来。（DB、Log都可以）

## 判断子进程状态

上述主循环中，我们有这样一句：

	while pty_is_alived(pty_pid):
		....

我们循环的前提是，子进程是存活的。当子进程一旦不再存活，我们的主循环也要保证安全退出，不能卡住。

一般我们判断某个进程是否退出，会用kill给他发送一个为0的信号，如果进程正常，不会有任何反应。如果进程不存在，则会出错，因此我们这样实现这个函数：

	import os
	
	def pty_is_alived(pid):
	    try:
	        os.kill(pid, 0)
	    except OSError:
	        return False
	    else:
	        return True

## 还原标准I/O流属性

到这里，基本整个的流程就完善了。

但是在上边，我们修改了stdin和stdout的属性。在该进程中交互是没有问题的，但是当进程退出，原bash是无法正常工作的。因为stdin的属性被修改过，所有的控制字符都不会被处理。

为了保证原bash继续正常的执行，我们还需要进行一系列的善后工作，那就是：**还原标准I/O属性**。

在修改标准I/O属性之前，我们要先对他们的属性，进行备份：

	import sys, termios
	
	stdin_origin_attr = termios.tcgetattr(sys.stdin.fileno())
	stdout_origin_attr = termios.tcgetattr(sys.stdout.fileno())

备份之后，就可以尽情的对属性作出修改。但是在进程退出之前，必须要保证能将标准I/O的属性还原至原样：

	import sys, termios
	
	termios.tcsetattr(sys.stdin.fileno(), termios.TCSAFLUSH, stdin_origin_attr)
	termios.tcsetattr(sys.stdout.fileno(), termios.TCSAFLUSH, stdout_origin_attr)

termios包的文档见上文。


## 小结

到这里，整个的流程就基本完结了。我们的虚拟的pty也可以正常的进行交互。

在技术与真理的路上，我们永远都只是孩子，如果此篇文章哪里有不当之处，还请不吝赐教。

后续我会整理下代码，发到github上分享给大家。

