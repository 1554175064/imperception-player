import ProcessingVideo from "video-green-screen-processing";

type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X ? 1 : 2) extends <
  T
>() => T extends Y ? 1 : 2
  ? A
  : B;

type WritableProps<T> = {
  [P in keyof T]: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P>;
}[keyof T];

type WritableKeysOfHTMLVideoElement = WritableProps<HTMLVideoElement>;

interface IOption {
  onVideoEnded?: (url: string) => void;
  defaultUrl?: string;
  processOptions?: {
    videoGreenCutout: boolean;
    videoGreenCutoutColor: number | string;
  };
}
function detectWebGL() {
  // 尝试获取标准的 WebGL 上下文。如果失败，回退到试验性上下文。
  var canvas = document.createElement("canvas");
  var gl =
    canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

  if (gl && gl instanceof WebGLRenderingContext) {
    // WebGL 是受支持的
    // return "WebGL is supported";
    return true;
  } else {
    // WebGL 不受支持，或者浏览器中禁用了它
    // return "WebGL is not supported";
    return false;
  }
}

class ImperceptionPlayer<T extends WritableKeysOfHTMLVideoElement> {
  private container: null | HTMLElement; //播放容器
  private video1: null | HTMLVideoElement; //播放器1
  private video1Destroy: null | (() => void); //播放器1销毁订阅事件方法
  private video2: null | HTMLVideoElement; //播放器2
  private video2Destroy: null | (() => void); //播放器2销毁订阅事件方法
  private onVideoEnded: (url: string) => void | null; //当前播放结束回调（非静默视频）
  private currentIndex = 0; //当前正在播放的播放器标记
  private defaultUrl = ""; //静默视频地址
  private processOptions = {
    videoGreenCutout: false, // 是否开启扣绿，需要支持webgl，部分移动端浏览器不支持（如uc、夸克等阿里系浏览器）
    videoGreenCutoutColor: 0x00ff00, //要扣绿的颜色
  };
  private videoProcessing: null | ProcessingVideo; //视频处理实例
  private videoGreenCutoutContainer: HTMLDivElement | null; //扣绿输出容器（会扣绿后输出一张canvas来展示视频画面）
  private firstPlay: boolean = true; //是否首次播放，这个当作扣绿时机，避免首次闪屏
  private videoShowRes: null | ((value?: unknown) => void); //视频实际显示后触发（可能比play事件晚一百毫秒左右，用来兼容部分移动端）
  private userHasInteracted = false; //用户是否与浏览器交互过，用来自动播放
  private cacheArr: [T, HTMLVideoElement[T]][] = [];
  playingDom: null | HTMLVideoElement; //当前正在播放的dom

  //给视频标签添加样式和属性
  private addVideoStyle(dom: HTMLVideoElement) {
    dom.style.position = "absolute";
    dom.style.width = "100%";
    dom.style.height = "100%";
    //初始全部为隐藏，播放才显示
    dom.style.visibility = "hidden";
    dom.controls = false;
    dom.crossOrigin = "anonymous";
    dom.setAttribute("playsinline", "true");
    dom.setAttribute("x5-playsinline", "true");
    dom.setAttribute("webkit-playsinline", "true");
    dom.setAttribute("x5-video-player-type", "h5");
    dom.setAttribute("x5-video-orientation", "portrait");
    dom.setAttribute("x-webkit-airplay", "allow");
    return dom;
  }
  //播放结束的回调，返回播放完成的视频地址
  private endedFinish(url: string) {
    if (url === this.defaultUrl) {
      return;
    }
    this.onVideoEnded(url);
  }
  //指定播放器切换视频
  private videoSetUrl(video: HTMLVideoElement, url: string) {
    video.muted = true;
    video.src = url;
  }
  //给播放器添加回调
  private addVideoEvent(
    video1: HTMLVideoElement,
    video2: HTMLVideoElement,
    currentvideo1Index: number
  ) {
    //播放结束,如果当前播放默认视频，则重复播放，否则切换视频
    const ended = async () => {
      if (this.currentIndex !== currentvideo1Index) {
        return;
      }
      if (video1.src === this.defaultUrl) {
        video1.currentTime = 0;
        await video1.play();
      } else {
        this.endedFinish(video1.src);
        this.videoSetUrl(video2, this.defaultUrl);
      }
    };
    video1.addEventListener("ended", ended);
    //开始播放,从有时间开始算，否则有部分移动端机器会有两个视频切换闪烁
    const timeupdate = (e: Event) => {
      if (
        (e.target as unknown as HTMLMediaElement).currentTime > 0 &&
        this.currentIndex !== currentvideo1Index
      ) {
        if (this.firstPlay && this.processOptions.videoGreenCutout) {
          this.firstPlay = false;
          this.videoProcessing.initVideoScene(
            this.video1.id,
            this.videoGreenCutoutContainer.id,
            this.processOptions.videoGreenCutoutColor
          );
        }
        this.currentIndex = currentvideo1Index;
        this.playingDom = video1;
        //如果开启了扣绿功能，不更改播放器显隐，更改扣绿视频源
        if (this.processOptions.videoGreenCutout) {
          this.videoProcessing.setVideoSource(
            video1.id,
            this.processOptions.videoGreenCutoutColor
          );
        } else {
          video1.style.visibility = "visible";
          video2.style.visibility = "hidden";
        }
        if (video1.src !== this.defaultUrl && this.videoShowRes) {
          this.videoShowRes();
        }
      }
    };
    //用timeupdate不用play做回调是因为在移动端两个播放器来回切换会有闪烁,但是弊端是会有100-200毫秒左右的切换间隔
    video1.addEventListener("timeupdate", timeupdate);
    //视频加载完成，开始播放
    const loadeddata = async () => {
      await video1.play();
      //这行代码是专门兼容阿里系的垃圾浏览器
      if (this.userHasInteracted) video1.muted = false;
      video2.pause();
    };
    video1.addEventListener("loadeddata", loadeddata);
    //每次加载完元数据挂在缓存的属性
    const loadedmetadata = () => {
      this.cacheArr.forEach((item) => {
        this.video1[item[0]] = item[1];
      });
    };
    this.video1.addEventListener("loadedmetadata", loadedmetadata);
    return () => {
      video1.removeEventListener("timeupdate", timeupdate);
      //这个触发播放的时机特别严苛
      //ios播放前不触发canplay和canplaythrough，只有播放后才触发
      //安卓部分老版本chrome不触发progress
      //但是loadeddata作为播放时机可能会有一丢丢卡顿
      video1.removeEventListener("loadeddata", loadeddata);
      video1.removeEventListener("ended", ended);
      video1.removeEventListener("loadedmetadata", loadedmetadata);
    };
  }
  private hidden() {
    if (!this.video1 || !this.video2) {
      return;
    }
    this.video1.src = this.defaultUrl;
    this.video2.src = this.defaultUrl;
  }
  //重置数据，销毁订阅事件
  private resetData() {
    this.video1Destroy && this.video1Destroy();
    this.video2Destroy && this.video2Destroy();
    this.video1 = null;
    this.video2 = null;
    this.video1Destroy = null;
    this.video2Destroy = null;
    this.videoGreenCutoutContainer = null;
    this.currentIndex = 0;
    this.defaultUrl = "";
    this.firstPlay = true;
    this.onVideoEnded = () => {};
    this.playingDom = null;
  }
  //创建视频播放器
  private createVideo(id: string) {
    const video = document.createElement("video");
    video.loop = false;
    video.id = id;
    video.muted = true;
    // video.src = "";
    this.addVideoStyle(video);
    this.container?.appendChild(video);
    return video;
  }
  //开启视频扣绿
  private openVideoGreenCutout() {
    this.videoProcessing = new ProcessingVideo();
    const canvasContainer = document.createElement("div");
    canvasContainer.style.zIndex = "1000";
    canvasContainer.id = "canvasPlayer";
    canvasContainer.style.position = "absolute";
    canvasContainer.style.width = "100%";
    canvasContainer.style.height = "100%";
    this.videoGreenCutoutContainer = canvasContainer;
    this.container.appendChild(this.videoGreenCutoutContainer);
    this.video1.style.visibility = "hidden";
    this.video2.style.visibility = "hidden";
  }
  //监听用户与页面交互过
  private listenerInteraction() {
    const events = [
      "click",
      "dblclick",
      "keydown",
      "keypress",
      "keyup",
      "mousedown",
      "mouseup",
      "touchend",
      "touchmove",
      "touchstart",
    ];
    const fn = () => {
      // 用户触发了一个交互事件，因此将 userHasInteracted 设置为 true
      this.userHasInteracted = true;
      // 移除所有事件监听器
      events.forEach((event) => {
        window.removeEventListener(event, fn);
      });
    };
    // 为每一个事件添加监听器
    events.forEach((event) => {
      window.addEventListener(event, fn);
    });
  }

  /**
   * 初始化
   * @param id 播放器容器id
   * @param options {Ioption}
   */
  init(id: string, options?: IOption) {
    if (!id) {
      throw new Error("请输入容器id");
    }
    const videoContainer = document.getElementById(id);
    if (!videoContainer) {
      throw new Error("未找到" + id);
    }
    this.listenerInteraction();
    this.container = videoContainer;
    this.destroy();
    this.defaultUrl = options.defaultUrl;
    this.onVideoEnded = options.onVideoEnded;
    this.video1 = this.createVideo("video1");
    this.video2 = this.createVideo("video2");
    //如果开启了扣绿功能
    if (options?.processOptions?.videoGreenCutout) {
      if (detectWebGL()) {
        const processOptions = Object.assign(
          this.processOptions,
          options.processOptions
        );
        this.processOptions = processOptions;
        this.openVideoGreenCutout();
      } else {
        console.error("不支持webgl进行扣绿");
        alert("不支持webgl进行扣绿");
      }
    }

    this.video1Destroy = this.addVideoEvent(this.video1, this.video2, 1);
    this.video2Destroy = this.addVideoEvent(this.video2, this.video1, 2);
    this.video1.src = this.defaultUrl;
  }
  /**
   * 更改音量
   * @param num 音量
   * @returns
   */
  setVol(num: number) {
    if (!this.video1 || !this.video2) {
      return;
    }
    this.video1.muted = false;
    this.video2.muted = false;
    this.video1.volume = num;
    this.video2.volume = num;
  }
  /**
   * 暂停
   */
  pause() {
    if (this.currentIndex === 1) {
      this.video1?.pause();
    } else {
      this.video2?.pause();
    }
  }
  /**
   * 播放
   */
  play() {
    if (this.currentIndex === 1) {
      this.video1?.play();
    } else {
      this.video2?.play();
    }
  }
  /**
   * 更改播放地址
   * @param url 播放地址
   * @returns 返回Promise代表视频切换并成功显示在屏幕上
   */
  setUrl(url: string) {
    return new Promise((res) => {
      if (!this.video1 || !this.video2) {
        return;
      }
      if (this.currentIndex === 1) {
        this.video2.muted = true;
        this.video2.src = url;
      } else {
        this.video1.muted = true;
        this.video1.src = url;
      }
      this.videoShowRes = res;
    });
  }
  /**
   * 销毁
   */
  destroy() {
    if (!this.container) {
      return;
    }
    this.container.innerHTML = "";
    this.resetData();
  }
  /**
   * 重新绑定部分事件，用于类似react hooks中state更改后回调无法获取最新数据的问题
   * @param onVideoEnded 视频播放结束的回调
   */
  ReBindEventListener(onVideoEnded: (url: string) => void) {
    this.onVideoEnded = onVideoEnded;
  }
  /**
   * 更改播放器属性
   * @param attr 属性名
   * @param value 属性值
   * @param isCache 是否对更改属性做缓存，部分属性在播放器地址更改后会被重置，此时如需要保留则设置为true
   * @returns
   */
  setVideoAttr(attr: T, value: HTMLVideoElement[T], isCache: boolean = false) {
    if (!this.video1 || !this.video2) {
      return;
    }
    this.video1[attr] = value;
    this.video2[attr] = value;
    if (isCache) {
      this.cacheArr.push([attr, value]);
    }
  }
}
export default ImperceptionPlayer;
