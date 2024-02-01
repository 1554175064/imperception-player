type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;
type WritableProps<T> = {
    [P in keyof T]: IfEquals<{
        [Q in P]: T[P];
    }, {
        -readonly [Q in P]: T[P];
    }, P>;
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
declare class ImperceptionPlayer<T extends WritableKeysOfHTMLVideoElement> {
    private container;
    private video1;
    private video1Destroy;
    private video2;
    private video2Destroy;
    private onVideoEnded;
    private currentIndex;
    private defaultUrl;
    private processOptions;
    private videoProcessing;
    private videoGreenCutoutContainer;
    private firstPlay;
    private videoShowRes;
    private userHasInteracted;
    private cacheArr;
    playingDom: null | HTMLVideoElement;
    private addVideoStyle;
    private endedFinish;
    private videoSetUrl;
    private addVideoEvent;
    private hidden;
    private resetData;
    private createVideo;
    private openVideoGreenCutout;
    private listenerInteraction;
    /**
     * 初始化
     * @param id 播放器容器id
     * @param options {Ioption}
     */
    init(id: string, options?: IOption): void;
    /**
     * 更改音量
     * @param num 音量
     * @returns
     */
    setVol(num: number): void;
    /**
     * 暂停
     */
    pause(): void;
    /**
     * 播放
     */
    play(): void;
    /**
     * 更改播放地址
     * @param url 播放地址
     * @returns 返回Promise代表视频切换并成功显示在屏幕上
     */
    setUrl(url: string): Promise<unknown>;
    /**
     * 销毁
     */
    destroy(): void;
    /**
     * 重新绑定部分事件，用于类似react hooks中state更改后回调无法获取最新数据的问题
     * @param onVideoEnded 视频播放结束的回调
     */
    ReBindEventListener(onVideoEnded: (url: string) => void): void;
    /**
     * 更改播放器属性
     * @param attr 属性名
     * @param value 属性值
     * @param isCache 是否对更改属性做缓存，部分属性在播放器地址更改后会被重置，此时如需要保留则设置为true
     * @returns
     */
    setVideoAttr(attr: T, value: HTMLVideoElement[T], isCache?: boolean): void;
}
export default ImperceptionPlayer;
