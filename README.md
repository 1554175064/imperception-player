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
player.init();
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

```typescript
/**
 * 更改音量
 * @param num 音量
 * @returns
 */
player.setVol(num);
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
player.destroy();
```

重新绑定部分事件，用于类似 react hooks 中 state 更改后回调无法获取最新数据的问题

```typescript
/**
 * 重新绑定部分事件，用于类似react hooks中state更改后回调无法获取最新数据的问题
 * @param onVideoEnded 视频播放结束的回调
 */
player.ReBindEventListener(onVideoEnded);
```

更改播放器属性

```typescript
/**
 * 更改播放器属性
 * @param attr 属性名
 * @param value 属性值
 * @param isCache 是否对更改属性做缓存，部分属性在播放器地址更改后会被重置，此时如需要保留则设置为true
 * @returns
 */
player.setVideoAttr("playbackRate", 0.5, true);
```

获取当前正在播放的 dom 节点

```typescript
//当前正在播放的dom节点，需要什么属性或状态可以直接获取
//不要去操作dom，因为播放器内部会进行一些操作，可能会导致播放器出错
player.playingDom;
```
