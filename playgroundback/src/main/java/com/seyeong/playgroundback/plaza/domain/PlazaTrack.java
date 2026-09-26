package com.seyeong.playgroundback.plaza.domain;

import com.seyeong.playgroundback.global.domain.BaseCreatedTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Builder;
import lombok.Getter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * 틀 수 있는 곡 (P-15). 곡을 추가·교체할 때 배포하지 않아도 되도록 테이블로 둔다.
 * durationSec 은 실제 음원 길이와 반드시 맞아야 한다 — 짧으면 끝나기 전에 넘어가고, 길면 침묵이 흐른다.
 */
@Getter
@Entity
@Table(name = "plaza_tracks")
public class PlazaTrack extends BaseCreatedTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @Column(nullable = false, length = 40)
    private String title;

    @Column(nullable = false, length = 20)
    private String mood;

    @Column(name = "src_url", nullable = false, length = 500)
    private String srcUrl;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "duration_sec", nullable = false)
    private int durationSec;

    /** 목록 순서이자 다음 곡 순서다 (P-18). 겹치면 다음 곡이 어느 쪽인지 정해지지 않는다. */
    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "sort_order", nullable = false, unique = true)
    private int sortOrder;

    protected PlazaTrack() {
    }

    @Builder
    private PlazaTrack(String code, String title, String mood, String srcUrl, int durationSec, int sortOrder) {
        this.code = code;
        this.title = title;
        this.mood = mood;
        this.srcUrl = srcUrl;
        this.durationSec = durationSec;
        this.sortOrder = sortOrder;
    }
}
