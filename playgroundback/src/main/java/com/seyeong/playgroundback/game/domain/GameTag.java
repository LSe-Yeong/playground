package com.seyeong.playgroundback.game.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Builder;
import lombok.Getter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** 카드에 붙는 태그 (0-6). '#' 은 클라이언트가 붙인다. */
@Getter
@Entity
@Table(
        name = "game_tags",
        uniqueConstraints = @UniqueConstraint(name = "uk_game_tags_game_name", columnNames = {"game_id", "name"})
)
public class GameTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @Column(nullable = false, length = 20)
    private String name;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    protected GameTag() {
    }

    @Builder
    private GameTag(Game game, String name, int sortOrder) {
        this.game = game;
        this.name = name;
        this.sortOrder = sortOrder;
    }
}
