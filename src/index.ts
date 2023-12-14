import ProcessingVideo from "video-green-screen-processing";

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
    return "WebGL is supported";
  } else {
    // WebGL 不受支持，或者浏览器中禁用了它
    return "WebGL is not supported";
  }
}

class ImperceptionPlayer {
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
  private firstPlay: boolean = false; //是否首次播放，这个当作扣绿时机，避免首次闪屏
  private videoShowRes: null | ((value?: unknown) => void); //视频实际显示后触发（可能比play事件晚一百毫秒左右，用来兼容移动端）

  //给视频标签添加样式和属性
  private addVideoStyle(dom: HTMLVideoElement) {
    dom.style.position = "absolute";
    dom.style.width = "100%";
    dom.style.height = "100%";
    //初始全部为隐藏，播放才显示
    dom.style.visibility = "hidden";
    dom.controls = false;
    dom.crossOrigin = "anonymous";
    return dom;
  }
  //播放结束的回调，返回播放完成的视频地址
  private endedFinish(url: string) {
    if (url === this.defaultUrl) {
      return;
    }
    this.onVideoEnded(url);
  }
  //给播放器添加回调
  private addVideoEvent(
    video1: HTMLVideoElement,
    video2: HTMLVideoElement,
    currentvideo1Index: number
  ) {
    const ended = () => {
      if (this.currentIndex !== currentvideo1Index) {
        return;
      }
      if (video1.src === this.defaultUrl) {
        video1.currentTime = 0;
        video1.play();
      } else {
        this.endedFinish(video1.src);
        video2.src = this.defaultUrl;
      }
    };
    video1.addEventListener("ended", ended);
    const timeupdate = (e: Event) => {
      if (
        (e.target as unknown as HTMLMediaElement).currentTime > 0 &&
        this.currentIndex !== currentvideo1Index
      ) {
        if (!this.firstPlay && this.processOptions.videoGreenCutout) {
          this.firstPlay = true;
          this.videoProcessing.initVideoScene(
            this.video1.id,
            this.videoGreenCutoutContainer.id,
            this.processOptions.videoGreenCutoutColor
          );
        }
        this.currentIndex = currentvideo1Index;
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
        if (video1.src !== this.defaultUrl) {
          this.videoShowRes();
        }
      }
    };
    //用timeupdate不用play做回调是因为在移动端两个播放器来回切换会有闪烁,但是弊端是会有100-200毫秒左右的切换间隔
    video1.addEventListener("timeupdate", timeupdate);
    const canplaythrough = () => {
      video1.play();
      //这行代码是专门兼容阿里系的垃圾浏览器
      video1.muted = false;
      video2.pause();
    };
    video1.addEventListener("canplaythrough", canplaythrough);

    return () => {
      video1.removeEventListener("timeupdate", timeupdate);
      video1.removeEventListener("canplaythrough", canplaythrough);
      video1.removeEventListener("ended", ended);
    };
  }
  private hidden() {
    if (!this.video1 || !this.video2) {
      return;
    }
    this.video1.src = this.defaultUrl;
    this.video2.src = this.defaultUrl;
  }
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
    this.firstPlay = false;
    this.onVideoEnded = () => {};
  }
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

  /**
   *
   * @param id 播放器容器id
   * @param options {Ioption}
   */
  init(id: string, options: IOption) {
    if (!id) {
      throw new Error("请输入容器id");
    }
    const videoContainer = document.getElementById(id);
    if (!videoContainer) {
      throw new Error("未找到" + id);
    }
    this.container = videoContainer;
    this.destroy();
    this.defaultUrl = options.defaultUrl;
    this.onVideoEnded = options.onVideoEnded;
    this.video1 = this.createVideo("video1");
    this.video2 = this.createVideo("video2");
    //如果开启了扣绿功能
    if (options.processOptions.videoGreenCutout) {
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
}
export default ImperceptionPlayer;
