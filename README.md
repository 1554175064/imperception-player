# imperception-player

无感知播放器

支持视频无缝切换同时支持视频扣绿



#### DOC

调用

```js
import ImperceptionPlayer from "imperception-player";

const player = new ImperceptionPlayer();
```

或

```javascript
<script type="text/javascript" src="../dist/index.js"></script>;

const player = new ImperceptionPlayer();
```

初始化

```typescript
interface IOption {
    //视频播放结束的回调
  onVideoEnded?: (url: string) => void;
    //默认地址，如果传入则默认播放，且每次视频播放完成切换到默认视频
  defaultUrl?: string;
    //处理配置
  processOptions?: {
      //是否开启视频扣绿
    videoGreenCutout: boolean;
      //视频扣绿颜色
    videoGreenCutoutColor: number | string;
  };
}

/**
 *
 * @param id 播放器容器id
 * @param options {Ioption}
 */
player.init()
```

暂停

```typescript
player.pause();
```

播放

```typescript
player.play();
```

更改音量

```
/**
 * 更改音量
 * @param num 音量
 * @returns
 */
player.setVol(num)
```

切换播放地址

```typescript
/**
 * 更改播放地址
 * @param url 播放地址
 * @returns 返回Promise代表视频切换并成功显示在屏幕上
 */
player.setUrl(url);
```

销毁

```typescript
player.destroy()
```

重新绑定部分事件，用于类似react hooks中state更改后回调无法获取最新数据的问题

```
/**
 * 重新绑定部分事件，用于类似react hooks中state更改后回调无法获取最新数据的问题
 * @param onVideoEnded 视频播放结束的回调
 */
player.ReBindEventListener(onVideoEnded);
```

