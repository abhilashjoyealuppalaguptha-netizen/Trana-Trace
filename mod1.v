module led_pulse_gen (
    input  wire       clk,
    input  wire       rst,
    input  wire [1:0] fsm_state,
    output reg  [5:0] leds
);

reg [24:0] slow_cnt;
reg [22:0] fast_cnt;

always @(posedge clk or posedge rst) begin
    if (rst) begin
        slow_cnt <= 25'd0;
        fast_cnt <= 23'd0;
    end else begin
        slow_cnt <= slow_cnt + 25'd1;
        fast_cnt <= fast_cnt + 23'd1;
    end
end

always @(posedge clk or posedge rst) begin
    if (rst) begin
        leds <= 6'b111111;
    end else begin
        case (fsm_state)
            2'd0: leds <= 6'b111111; // NORMAL — all off
            2'd1: leds <= slow_cnt[24] ? 6'b111110 : 6'b111111; // FAKE_OFF — slow single pulse
            2'd2: leds <= fast_cnt[22] ? 6'b000000 : 6'b111111; // EMERGENCY — fast flash all
            2'd3: leds <= 6'b111111; // REAL_OFF — all off
            default: leds <= 6'b111111;
        endcase
    end
end

endmodule