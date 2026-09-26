package com.seyeong.playgroundback.game.domain;

import com.seyeong.playgroundback.global.domain.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.Builder;
import lombok.Getter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** 허브에 올라가는 카드 (0-6). code 가 클라이언트 라우팅 키다. */
@Getter
@Entity
@Table(name = "games")
public class Game extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @Column(nullable = false, length = 30)
    private String name;

    @Column(name = "name_en", nullable = false, length = 50)
    private String nameEn;

    @Column(nullable = false, length = 200)
    private String description;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "min_players", nullable = false)
    private int minPlayers;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "max_players", nullable = false)
    private int maxPlayers;

    @Column(name = "play_minutes", length = 20)
    private String playMinutes;

    @Column(name = "is_playable", nullable = false)
    private boolean playable;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @OneToMany(mappedBy = "game")
    private List<GameTag> tags = new ArrayList<>();

    protected Game() {
    }

    @Builder
    private Game(String code, String name, String nameEn, String description, String thumbnailUrl,
                 int minPlayers, int maxPlayers, String playMinutes, boolean playable, int sortOrder) {
        this.code = code;
        this.name = name;
        this.nameEn = nameEn;
        this.description = description;
        this.thumbnailUrl = thumbnailUrl;
        this.minPlayers = minPlayers;
        this.maxPlayers = maxPlayers;
        this.playMinutes = playMinutes;
        this.playable = playable;
        this.sortOrder = sortOrder;
    }
}
