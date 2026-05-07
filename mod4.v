module click_detector (
    input  wire       clk,
    input  wire       rst,
    input  wire       btn_raw,
    output reg  [1:0] click_count,
    output reg        click_valid
);

// Debounce (~20ms for 27MHz clock)
parameter DEBOUNCE_MAX = 20'd540_000;

// Click window (~1 second)
parameter WINDOW_MAX   = 25'd27_000_000;

reg [19:0] deb_cnt;
reg        btn_stable, btn_prev;

// ── Debounce logic ───────────────────────────────
always @(posedge clk or posedge rst) begin
    if (rst) begin
        deb_cnt    <= 20'd0;
        btn_stable <= 1'b1;
        btn_prev   <= 1'b1;
    end else begin
        btn_prev <= btn_stable;

        if (btn_raw == btn_stable)
            deb_cnt <= 20'd0;
        else begin
            deb_cnt <= deb_cnt + 20'd1;
            if (deb_cnt >= DEBOUNCE_MAX) begin
                btn_stable <= btn_raw;
                deb_cnt    <= 20'd0;
            end
        end
    end
end

// Detect button release (click event)
wire btn_release = (btn_stable == 1'b1 && btn_prev == 1'b0);

// ── Click counting logic ─────────────────────────
reg [24:0] win_timer;
reg        window_open;
reg [1:0]  cnt;

always @(posedge clk or posedge rst) begin
    if (rst) begin
        cnt         <= 2'd0;
        win_timer   <= 25'd0;
        window_open <= 1'b0;
        click_count <= 2'd0;
        click_valid <= 1'b0;
    end else begin
        click_valid <= 1'b0;

        // Register click
        if (btn_release) begin
            if (!window_open) begin
                window_open <= 1'b1;
                win_timer   <= 25'd0;
                cnt         <= 2'd1;
            end else begin
                if (cnt < 2'd3)
                    cnt <= cnt + 2'd1;
                else
                    cnt <= 2'd3; // saturate
            end
        end

        // Window timeout → finalize click count
        if (window_open) begin
            win_timer <= win_timer + 25'd1;

            if (win_timer >= WINDOW_MAX) begin
                click_count <= cnt;
                click_valid <= 1'b1;

                // reset for next cycle
                window_open <= 1'b0;
                cnt         <= 2'd0;
                win_timer   <= 25'd0;
            end
        end
    end
end

endmodule