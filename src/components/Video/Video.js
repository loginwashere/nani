import React, { Component } from 'react'
import { connect } from 'react-redux'
import { updatePlaybackTime } from '../../actions'

import Clappr from 'clappr'
import LevelSelector from 'level-selector'
import ChromecastPlugin from 'clappr-chromecast-plugin'
import ResponsiveContainer from '../../lib/clappr-responsive-container-plugin'
import PlaybackRatePlugin from 'clappr-playback-rate-plugin'

import withProxy, { replaceHttps } from '../../lib/withProxy'

import './Video.css'

class Video extends Component {
  constructor (props) {
    super(props)
    // manually store the amount of time watched
    this.loggedTime = props.media.playhead || 0
    // if already seeked
    this.seeked = false
    this.logTime = this.logTime.bind(this)

    this.playerRef = React.createRef()
  }

  // ignore updates!
  shouldComponentUpdate () {
    return false
  }

  componentDidMount () {
    window.logTime = async (time) => {
      await this.props.dispatch(updatePlaybackTime(time, this.props.id))
    }
    window.setLogToZero = false

    this.change()
  }

  componentWillUnmount () {
    this.destroyPlayer()
  }

  destroyPlayer () {
    if (this.player) {
      this.player.destroy()
    }
    this.player = null
  }

  change () {
    const { streamUrl, media, autoplay = false, playCallback = () => null } = this.props
    if (streamUrl && media) {
      if (this.player) {
        this.destroyPlayer()
      }

      this.player = new Clappr.Player({
        parent: this.playerRef.current,
        source: streamUrl,
        autoPlay: autoplay,
        poster: {
          // if the first image doesn't work, it'll fall back to the second
          custom: [
            `url(${media.screenshot_image && withProxy(media.screenshot_image.full_url)}) top left / cover no-repeat`,
            `url(${media.screenshot_image && replaceHttps(media.screenshot_image.full_url)}) top left / cover no-repeat`,
            // absolute final option
            `url(https://via.placeholder.com/640x360?text=No+Image) top left / cover no-repeat`
          ].join(', ')
        },
        plugins: {
          core: [Clappr.MediaControl, LevelSelector, ChromecastPlugin, ResponsiveContainer, PlaybackRatePlugin]
        },
        playback: {
          hlsjsConfig: {
            enableWorker: false
          }
        },
        levelSelectorConfig: {
          title: 'Quality',
          labels: {
            4: '1080p',
            3: '720p',
            2: '480p',
            1: '360p',
            0: '240p'
          }
        },
        chromecast: {
          media: {
            type: ChromecastPlugin.TvShow,
            title: media.name,
            subtitle: media.description,
            seriesTitle: media.collection_name,
            episode: media.episode_number || null
          }
        },
        playbackRateConfig: {
          defaultValue: '1.0',
          options: [
            {value: '0.5', label: '0.5x'},
            {value: '1.0', label: '1x'},
            {value: '1.5', label: '1.5x'},
            {value: '2.0', label: '2x'}
          ]
        },
        disableVideoTagContextMenu: true
      })
      this.player.on(Clappr.Events.PLAYER_PLAY, () => {
        // seek video on first player play, this will fix it on mobile too!
        if (media.playhead && !this.seeked) {
          this.player.seek(media.playhead)
        }
        // run the callback
        playCallback()
        this.seeked = true
      })
      this.player.on(Clappr.Events.PLAYER_PAUSE, () => {
        this.logTime()
      })
      this.player.on(Clappr.Events.PLAYER_ENDED, () => {
        this.logTime(media.duration)
      })
      this.player.on(Clappr.Events.PLAYER_ERROR, (error) => console.error('Error', error))
    }
  }

  async logTime (t) {
    const { dispatch, id } = this.props
    const time = t || this.player.getCurrentTime()

    // debug
    if (window.setLogToZero) {
      await dispatch(updatePlaybackTime(0, id))
      return
    }

    // log time only if it's greater than what is saved
    if (time !== 0 && time > this.loggedTime && process.env.NODE_ENV === 'production') {
      try {
        await dispatch(updatePlaybackTime(time, id))
      } catch (err) {
        console.error(err)
      }
      this.loggedTime = time
    }
  }

  render () {
    return (
      <div ref={this.playerRef} />
    )
  }
}

export default connect((store, props) => {
  return {
    Auth: store.Auth,
    media: store.Data.media[props.id]
  }
})(Video)
