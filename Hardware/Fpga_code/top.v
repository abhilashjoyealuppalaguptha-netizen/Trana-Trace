module top (
    input  wire clk,
    input  wire btn_raw,
    input  wire rst,
    output wire [5:0] leds,
    output wire uart_tx_pin
);

// Internal constant (battery always OK for demo)
wire batt_low = 1'b0;

// Power-on reset
reg [3:0] por_cnt = 4'd0;
reg       por_rst = 1'b1;

always @(posedge clk) begin
    if (por_cnt < 4'd15) begin
        por_cnt <= por_cnt + 4'd1;
        por_rst <= 1'b1;
    end else begin
        por_rst <= 1'b0;
    end
end

wire sys_rst = por_rst | (~rst);

// Click detector
wire [1:0] click_count;
wire       click_valid;

click_detector u_click (
    .clk         (clk),
    .rst         (sys_rst),
    .btn_raw     (btn_raw),
    .click_count (click_count),
    .click_valid (click_valid)
);

// FSM
wire [1:0] fsm_state;

trana_fsm u_fsm (
    .clk         (clk),
    .rst         (sys_rst),
    .click_count (click_count),
    .click_valid (click_valid),
    .batt_low    (batt_low),
    .fsm_state   (fsm_state)
);

// LED pulse generator
led_pulse_gen u_leds (
    .clk       (clk),
    .rst       (sys_rst),
    .fsm_state (fsm_state),
    .leds      (leds)
);

// UART TX — send state byte on FSM transition
reg [1:0] fsm_prev;
reg       tx_start;
reg [7:0] tx_data;

always @(posedge clk or posedge sys_rst) begin
    if (sys_rst) begin
        fsm_prev <= 2'd0;
        tx_start <= 1'b0;
        tx_data  <= 8'd0;
    end else begin
        tx_start <= 1'b0;
        if (fsm_state != fsm_prev) begin
            fsm_prev <= fsm_state;
            tx_data  <= {6'b0, fsm_state};
            tx_start <= 1'b1;
        end
    end
end

uart_tx #(
    .CLK_FREQ_HZ (27_000_000),
    .BAUD_RATE   (9_600)
) u_uart (
    .clk      (clk),
    .rst      (sys_rst),
    .tx_start (tx_start),
    .tx_data  (tx_data),
    .tx_pin   (uart_tx_pin),
    .tx_busy  ()
);

endmodule
