interface IOption {
    onVideoEnded?: (url: string) => void;
    defaultUrl?: string;
    processOptions?: {
        videoGreenCutout: boolean;
        videoGreenCutoutColor: number | string;
    };
}
declare class ImperceptionPlayer {
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
    private addVideoStyle;
    private endedFinish;
    private addVideoEvent;
    private hidden;
    private resetData;
    private createVideo;
    private openVideoGreenCutout;
    private listenerInteraction;
    /**
     *
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
}
export default ImperceptionPlayer;
